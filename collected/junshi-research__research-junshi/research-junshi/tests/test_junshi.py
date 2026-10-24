import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from junshi import Memory, identifiers
from daily import discover, parse_arxiv, parse_crossref, render, run, validate_config, fetch, NoRedirect

ROOT = Path(__file__).resolve().parents[1]
CONFIG = dict(arxiv_queries=['cat:stat.ME'], crossref_issns=[], lookback_days=7,
              max_per_source=100, digest_limit=10)
PAPER = dict(title='Causal inference with sparse controls', authors=['Ada Example'],
             abstract='Finite sample causal inference.', arxiv_id='2601.00001v1',
             published='2026-01-01', source='arxiv')


class MemoryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.m = Memory(Path(self.tmp.name) / 'store')
        self.m.remember('causal', 'interest', 'causal inference')

    def tearDown(self):
        self.m.close()
        self.tmp.cleanup()

    def test_versions_venue_and_repeat_suppression(self):
        pid = self.m.ingest([PAPER])[0]
        self.m.publish('2026-01-02', '# digest', [pid])
        venue = dict(PAPER, arxiv_id='2601.00001v2', doi='https://doi.org/10.1234/ABC', venue='Journal')
        self.assertEqual([pid], self.m.ingest([venue]))
        self.m.ingest([venue])
        record = self.m.paper(pid)
        self.assertEqual(2, len(record['history']))
        self.assertIn('doi:10.1234/abc', record['aliases'])
        self.assertEqual([], self.m.candidates())

    def test_title_author_fallback_and_distinct_authors(self):
        pid = self.m.ingest([PAPER])[0]
        venue = dict(PAPER, title='CAUSAL inference: with sparse controls', doi='10.1234/test')
        venue.pop('arxiv_id')
        self.assertEqual([pid], self.m.ingest([venue]))
        other = dict(venue, authors=['Bob Other'], doi='10.1234/other')
        self.assertNotEqual(pid, self.m.ingest([other])[0])

    def test_bridge_preserves_metadata_and_recommendations(self):
        first = self.m.ingest([PAPER])[0]
        venue = dict(title='Renamed causal inference work', doi='10.1234/venue', venue='Journal', authors=['Ada Example'])
        second = self.m.ingest([venue])[0]
        self.m.publish('2026-01-02', '# venue digest', [second])
        bridge = dict(PAPER, doi='10.1234/venue')
        self.assertEqual([first], self.m.ingest([bridge]))
        self.assertEqual('Journal', self.m.paper(first)['data']['venue'])
        self.assertEqual(3, len(self.m.paper(first)['history']))
        self.assertEqual(['2026-01-02'], self.m.paper(first)['recommended'])
        self.assertEqual([], self.m.candidates())

    def test_invalid_batch_rolls_back(self):
        with self.assertRaises(ValueError):
            self.m.ingest([PAPER, {'title': 'Missing identity'}])
        self.assertEqual(0, self.m.db.execute('SELECT count(*) FROM papers').fetchone()[0])
        with self.assertRaises(ValueError):
            self.m.ingest([{'title': 'Missing identity', 'authors': [' ']}])

    def test_bridge_batch_ids_resolve_and_are_not_reused(self):
        venue = dict(title='Renamed work', authors=['Ada Example'], doi='10.1234/venue')
        ids = self.m.ingest([PAPER, venue, dict(PAPER, doi='10.1234/venue')])
        self.assertEqual([1, 1, 1], ids)
        self.assertEqual(1, self.m.paper(2)['id'])
        new = self.m.ingest([dict(PAPER, title='Different causal inference', arxiv_id='2601.00002')])[0]
        self.assertGreater(new, 2)
        self.m.publish('2026-01-02', 'merged', [1, 2])
        self.assertEqual(['2026-01-02'], self.m.paper(2)['recommended'])

    def test_partial_publication_dates_sort_by_year(self):
        ids = self.m.ingest([dict(PAPER, published='2027'),
                            dict(PAPER, title='Another causal inference', arxiv_id='2601.00002', published='2026-12-31')])
        self.assertEqual(ids, [p['paper_id'] for p in self.m.candidates()])

    def test_preferences_feedback_and_revision_history(self):
        pid = self.m.ingest([PAPER])[0]
        self.m.remember('theory', 'feedback', 'finite sample', 'liked', 'User preference')
        self.assertEqual(2, self.m.candidates()[0]['relevance'])
        self.m.remember('sparse', 'direction', 'sparse controls', 'rejected', 'User: already tried')
        self.assertEqual([], self.m.candidates())
        self.m.remember('sparse', 'direction', 'sparse controls', 'archived', 'User reopened it')
        self.assertEqual(pid, self.m.candidates()[0]['paper_id'])
        self.assertEqual(2, self.m.db.execute('SELECT count(*) FROM memory_history WHERE key="sparse"').fetchone()[0])
        self.m.remember('causal', 'interest', 'causal inference', 'archived')
        self.m.remember('theory', 'feedback', 'finite sample', 'archived')
        self.m.remember('guess', 'interest', 'causal inference', 'proposed')
        self.assertEqual([], self.m.candidates())

    def test_active_topic_ranks_before_general_feedback(self):
        self.m.remember('theory', 'feedback', 'finite sample', 'liked')
        topic = dict(PAPER, abstract='Causal inference with sparse controls.', published='2026-01-01')
        broad = dict(PAPER, title='Finite sample graph estimation', abstract='Finite sample guarantees.',
                     arxiv_id='2601.00002', published='2026-09-17')
        ids = self.m.ingest([topic, broad])
        self.assertEqual(ids, [p['paper_id'] for p in self.m.candidates()])

    def test_unselected_papers_remain_eligible(self):
        ids = self.m.ingest([PAPER, dict(PAPER, title='Other causal inference paper', arxiv_id='2601.00002')])
        self.m.publish('2026-01-02', 'one selected', ids[:1])
        self.assertEqual([ids[1]], [p['paper_id'] for p in self.m.candidates()])
        with self.assertRaises(ValueError):
            self.m.publish('2026-01-03', 'repeat', ids)
        self.assertEqual([], self.m.paper(ids[1])['recommended'])

    def test_publish_recovery_and_same_day_idempotence(self):
        pid = self.m.ingest([PAPER])[0]
        with patch('junshi.atomic_write', side_effect=OSError('disk unavailable')):
            with self.assertRaises(OSError):
                self.m.publish('2026-01-02', 'original', [pid])
        path = self.m.publish('2026-01-02', 'replacement ignored', [])
        self.assertEqual('original', Path(path).read_text())
        self.assertEqual(['2026-01-02'], self.m.paper(pid)['recommended'])
        with self.assertRaises(ValueError):
            self.m.publish('../bad', 'invalid', [])

    def test_two_hosts_share_persistent_state(self):
        pid = self.m.ingest([PAPER])[0]
        other = Memory(self.m.root)
        try:
            other.publish('2026-01-02', 'Codex digest', [pid])
            self.assertEqual([], self.m.candidates())
            self.assertEqual('causal', other.context()[0]['key'])
        finally:
            other.close()

    def test_legacy_migration_idempotent(self):
        legacy = Path(self.tmp.name) / 'legacy'
        (legacy / 'digests').mkdir(parents=True)
        (legacy / 'profile.md').write_text('old profile')
        (legacy / 'digests/2026-01-02.md').write_text('Paper https://arxiv.org/abs/2601.00001v1')
        self.m.migrate(legacy)
        self.m.migrate(legacy)
        self.m.ingest([PAPER])
        self.assertEqual([], self.m.candidates())
        self.assertEqual('old profile', (self.m.root / 'profile.md').read_text())
        self.assertTrue((legacy / 'profile.md').exists())

    def test_migration_recovers_failed_export(self):
        legacy = Path(self.tmp.name) / 'legacy'
        (legacy / 'digests').mkdir(parents=True)
        (legacy / 'digests/2026-01-02.md').write_text('old digest')
        with patch('junshi.atomic_write', side_effect=OSError('disk unavailable')):
            with self.assertRaises(OSError):
                self.m.migrate(legacy)
        self.m.migrate(legacy)
        self.assertEqual('old digest', (self.m.root / 'digests/2026-01-02.md').read_text())

    @patch('daily.discover', return_value=([PAPER], ['Fixture source']))
    def test_daily_end_to_end_and_next_day_no_repeats(self, mocked):
        first = run(self.m, CONFIG, '2026-01-02')
        self.assertIn(PAPER['title'], Path(first).read_text())
        run(self.m, CONFIG, '2026-01-02')
        self.assertEqual(1, mocked.call_count)
        second = run(self.m, CONFIG, '2026-01-03')
        self.assertIn('No unseen papers', Path(second).read_text())

    @patch('daily.discover', side_effect=OSError('API unavailable'))
    def test_source_failure_does_not_publish_or_mark(self, mocked):
        pid = self.m.ingest([PAPER])[0]
        with self.assertRaises(OSError):
            run(self.m, CONFIG, '2026-01-02')
        self.assertFalse((self.m.root / 'digests/2026-01-02.md').exists())
        self.assertEqual([], self.m.paper(pid)['recommended'])


class SourceTests(unittest.TestCase):
    def test_discovery_reports_caps_and_filters_old_updates(self):
        from datetime import date
        today = date.today().isoformat()
        xml = f'''<feed xmlns="http://www.w3.org/2005/Atom" xmlns:o="http://a9.com/-/spec/opensearch/1.1/">
        <o:totalResults>100</o:totalResults><entry><id>http://arxiv.org/abs/2601.00001v2</id>
        <title>Causal inference</title><updated>{today}</updated></entry></feed>'''
        with patch('daily.fetch', return_value=xml):
            papers, coverage = discover(dict(CONFIG, max_per_source=1))
            self.assertEqual(1, len(papers))
            self.assertIn('CAP REACHED', coverage[0])
        with patch('daily.fetch', return_value=xml.replace(today, '2000-01-01')):
            papers, coverage = discover(CONFIG)
            self.assertEqual([], papers)
            self.assertNotIn('CAP REACHED', coverage[0])

    def test_arxiv_parser(self):
        xml = '''<feed xmlns="http://www.w3.org/2005/Atom" xmlns:x="http://arxiv.org/schemas/atom">
        <entry><id>http://arxiv.org/abs/2601.00001v2</id><title>Causal inference</title>
        <summary>Abstract</summary><author><name>Ada Example</name></author>
        <published>2026-01-01T00:00:00Z</published><updated>2026-01-02T00:00:00Z</updated>
        <x:doi>10.1234/test</x:doi><category term="stat.ME"/></entry></feed>'''
        papers, total = parse_arxiv(xml)
        self.assertEqual(1, total)
        self.assertEqual('10.1234/test', papers[0]['doi'])
        self.assertEqual(['stat.ME'], papers[0]['categories'])
        self.assertIn('arxiv:2601.00001', identifiers(papers[0]))

    def test_crossref_parser(self):
        body = {'status': 'ok', 'message': {'total-results': 1, 'items': [
            {'title': ['Causal inference'], 'DOI': '10.1234/test', 'container-title': ['Journal'],
             'author': [{'given': 'Ada', 'family': 'Example'}], 'published': {'date-parts': [[2026, 1]]},
             'abstract': '<jats:p>Abstract &amp; result</jats:p>'}]}}
        papers, total = parse_crossref(json.dumps(body))
        self.assertEqual('2026-01', papers[0]['published'])
        self.assertEqual(['Ada Example'], papers[0]['authors'])
        self.assertIn('Abstract & result', papers[0]['abstract'])

    def test_reject_unbounded_sources_and_redirects(self):
        with self.assertRaises(ValueError): validate_config(dict(CONFIG, max_per_source=10000))
        with self.assertRaises(ValueError): validate_config(dict(CONFIG, crossref_issns=['url:evil']))
        with self.assertRaises(ValueError): fetch('https://example.com', {})
        with self.assertRaises(ValueError): NoRedirect().redirect_request(None, None, 302, '', {}, 'https://example.com')

    def test_render_escapes_remote_markdown(self):
        p = dict(PAPER, title='![x](https://evil.test/image)', abstract='<script>bad</script>',
                 paper_id=1, matched_memories=['causal'])
        digest = render('2026-01-01', [p], ['source'])
        self.assertNotIn('![x](', digest)
        self.assertNotIn('<script>', digest)
        self.assertIn('https://arxiv.org/abs/2601.00001', digest)


class CronTests(unittest.TestCase):
    def test_setup_preserves_other_jobs_and_quotes_paths(self):
        with tempfile.TemporaryDirectory(prefix="junshi space '") as folder:
            root = Path(folder)
            store = root / 'store'
            m = Memory(store)
            m.remember('causal', 'interest', 'causal inference')
            m.close()
            (store / 'config.json').write_text(json.dumps(CONFIG))
            fake = root / 'crontab'
            fake.write_text('#!/bin/sh\nif [ "$1" = -l ]; then cat "$FAKE_CRON"; else cat > "$FAKE_CRON"; fi\n')
            fake.chmod(0o700)
            cronfile = root / 'jobs'
            unrelated = '15 3 * * * /bin/echo keep-me\n'
            cronfile.write_text(unrelated + '0 8 * * * old-command # research-junshi\n')
            env = dict(os.environ, PATH=str(root) + os.pathsep + os.environ['PATH'], JUNSHI_HOME=str(store), FAKE_CRON=str(cronfile))
            bad = subprocess.run(['bash', str(ROOT / 'setup_automation.sh')], input='99:00\n', text=True, env=env, capture_output=True)
            self.assertNotEqual(0, bad.returncode)
            self.assertIn('old-command', cronfile.read_text())
            result = subprocess.run(['bash', str(ROOT / 'setup_automation.sh')], input='08:05\ny\ny\n', text=True, env=env, capture_output=True)
            self.assertEqual(0, result.returncode, result.stderr)
            jobs = cronfile.read_text()
            self.assertIn(unrelated, jobs)
            self.assertNotIn('old-command', jobs)
            self.assertEqual(1, jobs.count('# research-junshi'))
            self.assertIn('5 8 * * *', jobs)
            self.assertIn('scripts/daily.py', jobs)
            # Exercise the generated shell quoting without network: seed today's digest.
            from datetime import date
            m = Memory(store)
            m.publish(date.today().isoformat(), 'fixture digest', [])
            m.close()
            command = next(line for line in jobs.splitlines() if '# research-junshi' in line).split(' ', 5)[5]
            executed = subprocess.run(['/bin/sh', '-c', command], env=env, capture_output=True, text=True)
            self.assertEqual(0, executed.returncode, executed.stderr)
            self.assertIn('digests', (store / 'cron-junshi.log').read_text())


if __name__ == '__main__':
    unittest.main()

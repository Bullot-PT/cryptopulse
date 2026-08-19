# VPS health — 2026-08-19 10:51:48Z

## Maquina
```
 12:51:48 up 23 days,  2:05,  0 user,  load average: 1.29, 0.76, 0.68

               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       1.1Gi       5.4Gi       105Mi       1.6Gi       6.6Gi
Swap:             0B          0B          0B

/dev/sda1        96G  6.5G   90G   7% /
Filesystem      Size  Used Avail Use% Mounted on

kernel: 6.8.0-136-generic  node: v22.23.1
```

## Servicos systemd
```
cryptomacho-book                                           active     restarts=0      desde=Tue 2026-07-28 10:58:53 CEST mem=102072320
cryptomacho-oi                                             active     restarts=0      desde=Wed 2026-08-19 12:42:26 CEST mem=181444608
cryptomacho-signal                                         active     restarts=0      desde=Wed 2026-08-19 12:33:45 CEST mem=34656256
regime-rider                                               inactive   restarts=0      desde= mem=[not set]
actions.runner.Bullot-PT-cryptopulse.cryptomacho-vps       active     restarts=0      desde=Fri 2026-07-31 06:18:13 CEST mem=244473856

-- timers --
NEXT                                  LEFT LAST                                PASSED UNIT                           ACTIVATES
Wed 2026-08-19 13:00:00 CEST          8min Wed 2026-08-19 12:50:16 CEST  1min 34s ago sysstat-collect.timer          sysstat-collect.service
Wed 2026-08-19 13:31:17 CEST         39min Wed 2026-08-19 12:33:45 CEST     18min ago fwupd-refresh.timer            fwupd-refresh.service
Wed 2026-08-19 18:20:00 CEST      5h 28min Wed 2026-08-19 12:20:08 CEST     31min ago cryptomacho-backup.timer       cryptomacho-backup.service
Thu 2026-08-20 00:00:00 CEST           11h Wed 2026-08-19 00:00:16 CEST       12h ago dpkg-db-backup.timer           dpkg-db-backup.service
Thu 2026-08-20 00:00:00 CEST           11h Wed 2026-08-19 00:00:16 CEST       12h ago logrotate.timer                logrotate.service
Thu 2026-08-20 00:07:00 CEST           11h Wed 2026-08-19 00:07:16 CEST       12h ago sysstat-summary.timer          sysstat-summary.service
Thu 2026-08-20 02:07:00 CEST           13h Wed 2026-08-19 02:07:00 CEST       10h ago regime-rider.timer             regime-rider.service
Thu 2026-08-20 02:16:23 CEST           13h Wed 2026-08-19 07:05:16 CEST  5h 46min ago apt-daily.timer                apt-daily.service
Thu 2026-08-20 03:53:12 CEST           15h Wed 2026-08-19 01:49:30 CEST       11h ago man-db.timer                   man-db.service
Thu 2026-08-20 04:00:00 CEST           15h Wed 2026-08-19 04:00:00 CEST        8h ago regime-rider-watchdog.timer    regime-rider-watchdog.service
Thu 2026-08-20 06:56:29 CEST           18h Wed 2026-08-19 06:02:38 CEST        6h ago apt-daily-upgrade.timer        apt-daily-upgrade.service
Thu 2026-08-20 07:16:59 CEST           18h Wed 2026-08-19 12:48:07 CEST  3min 43s ago motd-news.timer                motd-news.service
Thu 2026-08-20 10:53:38 CEST           22h Wed 2026-08-19 10:53:38 CEST  1h 58min ago update-notifier-download.timer update-notifier-download.service
Thu 2026-08-20 11:03:38 CEST           22h Wed 2026-08-19 11:03:38 CEST  1h 48min ago systemd-tmpfiles-clean.timer   systemd-tmpfiles-clean.service
Sun 2026-08-23 03:10:00 CEST        3 days Sun 2026-08-16 03:10:16 CEST    3 days ago e2scrub_all.timer              e2scrub_all.service
Mon 2026-08-24 00:12:12 CEST        4 days Mon 2026-08-17 00:38:45 CEST    2 days ago fstrim.timer                   fstrim.service
Thu 2026-08-27 10:28:56 CEST 1 week 0 days Mon 2026-08-17 22:30:36 CEST 1 day 14h ago update-notifier-motd.timer     update-notifier-motd.service
-                                        - -                                        - apport-autoreport.timer        apport-autoreport.service
-                                        - -                                        - snapd.snap-repair.timer        snapd.snap-repair.service
```

## Ficheiros data/ na VPS (mtime = ultima escrita real)
### /opt/cryptomacho/oi/data
```
total 11800
drwxr-xr-x 2 runner runner    4096 2026-08-19_12:50 .
drwxr-xr-x 3 runner runner    4096 2026-07-27_12:50 ..
-rw-r--r-- 1 runner runner   11614 2026-07-27_12:50 _kdebug.json
-rw-r--r-- 1 runner runner    4478 2026-07-27_12:50 alert-log.json
-rw-r--r-- 1 runner runner    2181 2026-07-27_12:50 alert-state.json
-rw-r--r-- 1 runner runner 2113086 2026-07-27_12:50 backtest-3y.json
-rw-r--r-- 1 runner runner   93955 2026-08-19_12:50 cg-mirror.json
-rw-r--r-- 1 runner runner      67 2026-08-19_12:47 collector-health.json
-rw-r--r-- 1 runner runner    6363 2026-08-19_12:46 hl-ls.json
-rw-r--r-- 1 runner runner  107037 2026-08-19_12:46 hl-pos.json
-rw-r--r-- 1 runner runner  662677 2026-08-19_12:46 hl-seen.json
-rw-r--r-- 1 runner runner   38795 2026-08-19_12:50 hl-wallets.json
-rw-r--r-- 1 runner runner  901722 2026-08-19_12:50 kalshi.json
-rw-r--r-- 1 runner runner  225842 2026-08-19_12:50 liq-book-lighter.json
-rw-r--r-- 1 runner runner   36626 2026-08-19_12:47 liq-book.json
-rw-r--r-- 1 runner runner   90410 2026-08-19_12:46 liq-totals.json
-rw-r--r-- 1 runner runner    2691 2026-08-19_12:35 market-ls.json
-rw-r--r-- 1 runner runner     801 2026-07-27_12:50 nansen-budget.json
-rw-r--r-- 1 runner runner 1246585 2026-07-27_12:50 nansen-labels.json
-rw-r--r-- 1 runner runner  334397 2026-07-27_12:50 nansen-names.json
-rw-r--r-- 1 runner runner  184355 2026-07-27_12:50 nansen-perps.json
-rw-r--r-- 1 runner runner   13973 2026-07-27_12:50 nansen-sm.json
-rw-r--r-- 1 runner runner 5854943 2026-08-19_12:50 oi-history.json
-rw-r--r-- 1 runner runner      35 2026-08-19_12:42 oi-signal-log.json
-rw-r--r-- 1 runner runner     353 2026-08-19_12:35 oi-signals.json
-rw-r--r-- 1 runner runner   63081 2026-07-27_12:50 radar-history.json
-rw-r--r-- 1 runner runner   19025 2026-08-19_12:50 upbit.json
```
### /opt/cryptomacho (book) 
```
total 499112
drwxr-xr-x 6 runner runner      4096 2026-07-28_11:29 .
drwxr-xr-x 4 root   root        4096 2026-07-28_10:57 ..
-rw-r--r-- 1 runner runner     19534 2026-07-28_10:58 book-collector.mjs
drwxr-xr-x 2 runner runner      4096 2026-07-27_10:45 data
-rw-r--r-- 1 runner runner 506834944 2026-08-19_12:09 data.db
-rw-r--r-- 1 runner runner     32768 2026-08-19_12:51 data.db-shm
-rw-r--r-- 1 runner runner   4148872 2026-08-19_12:51 data.db-wal
-rw------- 1 runner runner       199 2026-07-28_10:58 env
-rw------- 1 runner runner       183 2026-07-27_13:26 env-backup
drwxr-xr-x 4 runner runner      4096 2026-07-27_11:01 node_modules
drwxr-xr-x 3 runner runner      4096 2026-07-27_12:50 oi
-rw-r--r-- 1 runner runner      1099 2026-07-28_10:58 package-lock.json
-rw-r--r-- 1 runner runner       282 2026-07-27_11:01 package.json
drwxr-xr-x 3 runner runner      4096 2026-07-28_12:32 signal
-rwxr-xr-x 1 runner runner      1078 2026-07-27_13:26 vps-backup.sh
```

## journalctl — cryptomacho-oi (200 linhas)
```
Aug 19 12:05:13 vmi3467942 sh[727776]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:05:15 vmi3467942 sh[727776]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:05:24 vmi3467942 sh[727776]: kalshi events: 1500 withPrice: 1496 umbrella: 62 eventTitles: 4000
Aug 19 12:05:24 vmi3467942 sh[727776]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Tomas Quesada Perez win the Fernandes vs Quesada Perez: M25 Idanha-a-Nova Round of 32 match?
Aug 19 12:05:36 vmi3467942 sh[727776]: hl-wallets.json: 700 wallets
Aug 19 12:05:41 vmi3467942 sh[727776]: coinalyze 429, waiting 30.647s
Aug 19 12:09:32 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 12:09:32 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 12:09:33 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 12:09:34 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 12:09:36 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 12:09:36 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 12:09:37 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 12:09:38 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 12:10:00 vmi3467942 sh[162184]: --- pass at 10:10:00Z ---
Aug 19 12:10:11 vmi3467942 sh[727877]: global OI: $178.75B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:10:14 vmi3467942 sh[727877]: OI samples stored: 2294
Aug 19 12:10:14 vmi3467942 sh[727877]: coinalyze 429, waiting 6.334s
Aug 19 12:10:17 vmi3467942 sh[727877]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:10:20 vmi3467942 sh[727877]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:10:26 vmi3467942 sh[727877]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 12:10:26 vmi3467942 sh[727877]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Tomas Quesada Perez win the Fernandes vs Quesada Perez: M25 Idanha-a-Nova Round of 32 match?
Aug 19 12:10:30 vmi3467942 sh[727877]: hl-wallets.json: 700 wallets
Aug 19 12:14:30 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 12:14:30 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 12:14:31 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 12:14:31 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 12:14:31 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 12:14:32 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 12:14:33 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 12:14:34 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 12:15:00 vmi3467942 sh[162184]: --- pass at 10:15:00Z ---
Aug 19 12:15:04 vmi3467942 sh[727977]: global OI: $179.37B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:15:06 vmi3467942 sh[727977]: OI samples stored: 2294
Aug 19 12:15:09 vmi3467942 sh[727977]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:15:10 vmi3467942 sh[727977]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:15:20 vmi3467942 sh[727977]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 12:15:20 vmi3467942 sh[727977]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Tomas Quesada Perez win the Fernandes vs Quesada Perez: M25 Idanha-a-Nova Round of 32 match?
Aug 19 12:15:25 vmi3467942 sh[727977]: hl-wallets.json: 700 wallets
Aug 19 12:15:37 vmi3467942 sh[727977]: coinalyze 429, waiting 30.676s
Aug 19 12:19:29 vmi3467942 sh[727977]: hl-ls.json: 500 of 500 wallets · 48.5% long · 265 coins
Aug 19 12:19:29 vmi3467942 sh[727977]: wallet scan: 1899 addresses — 800 core + 500 rotating + 250 from the trade feed + 349 re-read because they are on screen
Aug 19 12:19:29 vmi3467942 sh[727977]: trade-feed harvest: 277 addresses on 30 coins, 22 new · pool 9822 (218 proven holders) · 250 read this pass, 101 holding
Aug 19 12:19:29 vmi3467942 sh[727977]: liq-book: 1899 wallets, 1460 positions, 151 coins
Aug 19 12:19:29 vmi3467942 sh[727977]: hl-pos: 141 coins, 571 addresses, coverage 41% of OI, 0 carried, rotation at 4540 of 14200, 104KB
Aug 19 12:19:30 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 12:19:30 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 12:19:31 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 12:19:31 vmi3467942 sh[162184]: kv put hl-ls.json: HTTP 200
Aug 19 12:19:32 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 12:19:32 vmi3467942 sh[162184]: kv put hl-seen.json: HTTP 200
Aug 19 12:19:33 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 12:19:33 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 12:19:33 vmi3467942 sh[162184]: kv put liq-book.json: HTTP 200
Aug 19 12:19:35 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 12:19:36 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 12:20:00 vmi3467942 sh[162184]: --- pass at 10:20:00Z ---
Aug 19 12:20:07 vmi3467942 sh[728092]: global OI: $179.41B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:20:09 vmi3467942 sh[728092]: OI samples stored: 2294
Aug 19 12:20:10 vmi3467942 sh[728092]: coinalyze 429, waiting 7.729s
Aug 19 12:20:13 vmi3467942 sh[728092]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:20:14 vmi3467942 sh[728092]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:20:27 vmi3467942 sh[728092]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 12:20:27 vmi3467942 sh[728092]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Tomas Quesada Perez win the Fernandes vs Quesada Perez: M25 Idanha-a-Nova Round of 32 match?
Aug 19 12:20:32 vmi3467942 sh[728092]: hl-wallets.json: 700 wallets
Aug 19 12:24:30 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 12:24:31 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 12:24:31 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 12:24:32 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 12:24:32 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 12:24:33 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 12:24:35 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 12:24:35 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 12:25:00 vmi3467942 sh[162184]: --- pass at 10:25:00Z ---
Aug 19 12:25:06 vmi3467942 sh[728611]: global OI: $179.24B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:25:07 vmi3467942 sh[728611]: OI samples stored: 2293
Aug 19 12:25:08 vmi3467942 sh[728611]: coinalyze 429, waiting 21.547s
Aug 19 12:25:11 vmi3467942 sh[728611]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:25:13 vmi3467942 sh[728611]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:25:22 vmi3467942 sh[728611]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 12:25:22 vmi3467942 sh[728611]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Tomas Quesada Perez win the Fernandes vs Quesada Perez: M25 Idanha-a-Nova Round of 32 match?
Aug 19 12:25:28 vmi3467942 sh[728611]: hl-wallets.json: 700 wallets
Aug 19 12:29:30 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 12:29:31 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 12:29:31 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 12:29:32 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 12:29:32 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 12:29:32 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 12:29:34 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 12:29:34 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 12:30:00 vmi3467942 sh[162184]: --- pass at 10:30:00Z ---
Aug 19 12:30:04 vmi3467942 sh[728706]: global OI: $179.17B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:30:07 vmi3467942 sh[728706]: OI samples stored: 2293
Aug 19 12:30:10 vmi3467942 sh[728706]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:30:12 vmi3467942 sh[728706]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:30:20 vmi3467942 sh[728706]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 12:30:20 vmi3467942 sh[728706]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Tomas Quesada Perez win the Fernandes vs Quesada Perez: M25 Idanha-a-Nova Round of 32 match?
Aug 19 12:30:24 vmi3467942 sh[728706]: hl-wallets.json: 700 wallets
Aug 19 12:30:38 vmi3467942 sh[728706]: coinalyze 429, waiting 30.586s
Aug 19 12:34:28 vmi3467942 sh[728706]: hl-ls.json: 500 of 500 wallets · 48.4% long · 265 coins
Aug 19 12:34:28 vmi3467942 sh[728706]: wallet scan: 1907 addresses — 800 core + 500 rotating + 250 from the trade feed + 357 re-read because they are on screen
Aug 19 12:34:28 vmi3467942 sh[728706]: trade-feed harvest: 202 addresses on 30 coins, 14 new · pool 9836 (218 proven holders) · 250 read this pass, 113 holding
Aug 19 12:34:28 vmi3467942 sh[728706]: liq-book: 1907 wallets, 1474 positions, 153 coins
Aug 19 12:34:28 vmi3467942 sh[728706]: hl-pos: 141 coins, 571 addresses, coverage 41% of OI, 0 carried, rotation at 5040 of 14200, 104KB
Aug 19 12:34:32 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 12:34:32 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 12:34:33 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 12:34:33 vmi3467942 sh[162184]: kv put hl-ls.json: HTTP 200
Aug 19 12:34:34 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 12:34:34 vmi3467942 sh[162184]: kv put hl-seen.json: HTTP 200
Aug 19 12:34:34 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 12:34:35 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 12:34:35 vmi3467942 sh[162184]: kv put liq-book.json: HTTP 200
Aug 19 12:34:37 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 12:34:37 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 12:35:00 vmi3467942 sh[162184]: --- pass at 10:35:00Z ---
Aug 19 12:35:08 vmi3467942 sh[729166]: global OI: $179.32B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:35:11 vmi3467942 sh[729166]: OI samples stored: 2293
Aug 19 12:35:11 vmi3467942 sh[729166]: coinalyze 429, waiting 6.385s
Aug 19 12:35:14 vmi3467942 sh[729166]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:35:16 vmi3467942 sh[729166]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:35:25 vmi3467942 sh[729166]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 12:35:25 vmi3467942 sh[729166]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Valeriya Strakhova win the Havlickova vs Strakhova: W50 Prague Round of 16 match?
Aug 19 12:35:31 vmi3467942 sh[729166]: hl-wallets.json: 700 wallets
Aug 19 12:35:46 vmi3467942 systemd[1]: Stopping cryptomacho-oi.service - Cryptomacho OI collector (24/7)...
Aug 19 12:35:46 vmi3467942 systemd[1]: cryptomacho-oi.service: Deactivated successfully.
Aug 19 12:35:46 vmi3467942 systemd[1]: Stopped cryptomacho-oi.service - Cryptomacho OI collector (24/7).
Aug 19 12:35:46 vmi3467942 systemd[1]: cryptomacho-oi.service: Consumed 2d 19h 4min 57.807s CPU time, 308.8M memory peak, 0B memory swap peak.
Aug 19 12:35:46 vmi3467942 systemd[1]: Started cryptomacho-oi.service - Cryptomacho OI collector (24/7).
Aug 19 12:35:46 vmi3467942 sh[729479]: --- pass at 10:35:46Z ---
Aug 19 12:35:49 vmi3467942 sh[729491]: global OI: $179.35B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:35:51 vmi3467942 sh[729491]: oi-history: merge KV +1 amostras
Aug 19 12:35:51 vmi3467942 sh[729491]: OI samples stored: 2294
Aug 19 12:35:51 vmi3467942 sh[729491]: coinalyze 429, waiting 28.488s
Aug 19 12:35:54 vmi3467942 sh[729491]: cg mirror: 8 trending, 0 markets, no global
Aug 19 12:35:56 vmi3467942 sh[729491]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:36:04 vmi3467942 sh[729491]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 12:36:04 vmi3467942 sh[729491]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Valeriya Strakhova win the Havlickova vs Strakhova: W50 Prague Round of 16 match?
Aug 19 12:36:08 vmi3467942 sh[729491]: hl-wallets.json: 700 wallets
Aug 19 12:40:13 vmi3467942 sh[729491]: hl-ls.json: 500 of 500 wallets · 48.4% long · 265 coins
Aug 19 12:40:13 vmi3467942 sh[729491]: wallet scan: 1902 addresses — 800 core + 500 rotating + 250 from the trade feed + 352 re-read because they are on screen
Aug 19 12:40:13 vmi3467942 sh[729491]: trade-feed harvest: 270 addresses on 30 coins, 38 new · pool 9874 (218 proven holders) · 250 read this pass, 100 holding
Aug 19 12:40:13 vmi3467942 sh[729491]: liq-book: 1902 wallets, 1458 positions, 150 coins
Aug 19 12:40:13 vmi3467942 sh[729491]: hl-pos: 141 coins, 573 addresses, coverage 41% of OI, 0 carried, rotation at 5540 of 14200, 104KB
Aug 19 12:40:16 vmi3467942 sh[729479]: ALERTA: collector MORTO PELO TIMEOUT aos 270s — a cauda da passagem nao correu
Aug 19 12:40:16 vmi3467942 sh[729479]: kv put alert-log.json: HTTP 200
Aug 19 12:40:17 vmi3467942 sh[729479]: kv put cg-mirror.json: HTTP 200
Aug 19 12:40:17 vmi3467942 sh[729479]: kv put collector-health.json: HTTP 200
Aug 19 12:40:18 vmi3467942 sh[729479]: kv put hl-ls.json: HTTP 200
Aug 19 12:40:18 vmi3467942 sh[729479]: kv put hl-pos.json: HTTP 200
Aug 19 12:40:18 vmi3467942 sh[729479]: kv put hl-seen.json: HTTP 200
Aug 19 12:40:18 vmi3467942 sh[729479]: kv put hl-wallets.json: HTTP 200
Aug 19 12:40:19 vmi3467942 sh[729479]: kv put kalshi.json: HTTP 200
Aug 19 12:40:19 vmi3467942 sh[729479]: kv put liq-book.json: HTTP 200
Aug 19 12:40:21 vmi3467942 sh[729479]: kv put oi-history.json: HTTP 200
Aug 19 12:40:21 vmi3467942 sh[729479]: kv put upbit.json: HTTP 200
Aug 19 12:42:26 vmi3467942 systemd[1]: Stopping cryptomacho-oi.service - Cryptomacho OI collector (24/7)...
Aug 19 12:42:26 vmi3467942 systemd[1]: cryptomacho-oi.service: Deactivated successfully.
Aug 19 12:42:26 vmi3467942 systemd[1]: Stopped cryptomacho-oi.service - Cryptomacho OI collector (24/7).
Aug 19 12:42:26 vmi3467942 systemd[1]: cryptomacho-oi.service: Consumed 54.389s CPU time, 259.8M memory peak, 0B memory swap peak.
Aug 19 12:42:26 vmi3467942 systemd[1]: Started cryptomacho-oi.service - Cryptomacho OI collector (24/7).
Aug 19 12:42:27 vmi3467942 sh[730407]: --- pass at 10:42:27Z ---
Aug 19 12:42:31 vmi3467942 sh[730420]: global OI: $179.38B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:42:33 vmi3467942 sh[730420]: OI samples stored: 2294
Aug 19 12:42:37 vmi3467942 sh[730420]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:42:38 vmi3467942 sh[730420]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:42:46 vmi3467942 sh[730420]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 12:42:46 vmi3467942 sh[730420]: kalshi sample titles: BTC price up in next 15 mins? | Will Sumit Nagal win the Kumstat vs Nagal: Round Of 16 match? | Will Valeriya Strakhova win the Havlickova vs Strakhova: W50 Prague Round of 16 match?
Aug 19 12:42:50 vmi3467942 sh[730420]: hl-wallets.json: 700 wallets
Aug 19 12:43:05 vmi3467942 sh[730420]: coinalyze 429, waiting 30.504s
Aug 19 12:46:12 vmi3467942 sh[730420]: coinalyze: minute pass incomplete — keeping previous minute data
Aug 19 12:46:12 vmi3467942 sh[730420]: coinalyze: 120 symbols across 32 bases, hourly+minute pass, 168 hourly + 0 minute buckets, 0 failed batches, 24h total $37.6M
Aug 19 12:46:55 vmi3467942 sh[730420]: hl-ls.json: 500 of 500 wallets · 48.4% long · 265 coins
Aug 19 12:46:55 vmi3467942 sh[730420]: wallet scan: 1909 addresses — 800 core + 500 rotating + 250 from the trade feed + 359 re-read because they are on screen
Aug 19 12:46:55 vmi3467942 sh[730420]: trade-feed harvest: 203 addresses on 30 coins, 11 new · pool 9885 (218 proven holders) · 250 read this pass, 110 holding
Aug 19 12:46:55 vmi3467942 sh[730420]: liq-book: 1909 wallets, 1479 positions, 155 coins
Aug 19 12:46:55 vmi3467942 sh[730420]: hl-pos: 141 coins, 574 addresses, coverage 41% of OI, 0 carried, rotation at 6040 of 14200, 105KB
Aug 19 12:47:04 vmi3467942 sh[730420]: dydx book: 2562 subaccounts with positions, 284 positions >= $10k, 24 coins, host: https://dydx-rest.publicnode.com
Aug 19 12:47:15 vmi3467942 sh[730407]: ALERTA: collector MORTO PELO TIMEOUT aos 288s — a cauda da passagem nao correu
Aug 19 12:47:16 vmi3467942 sh[730407]: kv put alert-log.json: HTTP 200
Aug 19 12:47:16 vmi3467942 sh[730407]: kv put cg-mirror.json: HTTP 200
Aug 19 12:47:16 vmi3467942 sh[730407]: kv put collector-health.json: HTTP 200
Aug 19 12:47:17 vmi3467942 sh[730407]: kv put hl-ls.json: HTTP 200
Aug 19 12:47:17 vmi3467942 sh[730407]: kv put hl-pos.json: HTTP 200
Aug 19 12:47:18 vmi3467942 sh[730407]: kv put hl-seen.json: HTTP 200
Aug 19 12:47:18 vmi3467942 sh[730407]: kv put hl-wallets.json: HTTP 200
Aug 19 12:47:18 vmi3467942 sh[730407]: kv put kalshi.json: HTTP 200
Aug 19 12:47:18 vmi3467942 sh[730407]: kv put liq-book.json: HTTP 200
Aug 19 12:47:19 vmi3467942 sh[730407]: kv put liq-totals.json: HTTP 200
Aug 19 12:47:21 vmi3467942 sh[730407]: kv put oi-history.json: HTTP 200
Aug 19 12:47:21 vmi3467942 sh[730407]: kv put upbit.json: HTTP 200
Aug 19 12:50:00 vmi3467942 sh[730407]: --- pass at 10:50:00Z ---
Aug 19 12:50:05 vmi3467942 sh[730711]: global OI: $179.47B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:50:07 vmi3467942 sh[730711]: OI samples stored: 2294
Aug 19 12:50:10 vmi3467942 sh[730711]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:50:13 vmi3467942 sh[730711]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:50:22 vmi3467942 sh[730711]: kalshi events: 1500 withPrice: 1496 umbrella: 58 eventTitles: 4000
Aug 19 12:50:22 vmi3467942 sh[730711]: kalshi sample titles: Will Sumit Nagal win the Kumstat vs Nagal: Round Of 16 match? | Will Tomas Quesada Perez win the Fernandes vs Quesada Perez: M25 Idanha-a-Nova Round of 32 match? | BTC price up in next 15 mins?
Aug 19 12:50:25 vmi3467942 sh[730711]: hl-wallets.json: 700 wallets
Aug 19 12:50:38 vmi3467942 sh[730711]: coinalyze 429, waiting 30.497s
```

## journalctl — cryptomacho-book (60)
```
Aug 19 12:47:03 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64387.165, 21b/23a bins)
Aug 19 12:47:03 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (852718 bytes, 179 frames, 633 trades)
Aug 19 12:47:03 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (270670 bytes, 179 frames, 105 trades)
Aug 19 12:47:04 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (401813 bytes, 179 frames, 14 trades)
Aug 19 12:47:04 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (335612 bytes, 179 frames, 22 trades)
Aug 19 12:47:04 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1918.41, 34b/44a bins)
Aug 19 12:47:05 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.34, 102b/102a bins)
Aug 19 12:47:07 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.3945, 251b/252a bins)
Aug 19 12:47:08 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.07004, 102b/102a bins)
Aug 19 12:47:11 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3196555 bytes)
Aug 19 12:48:02 vmi3467942 node[27456]: kv put book-hires-BTC.json: HTTP 200 (614115 bytes, 179 frames, 472 trades)
Aug 19 12:48:02 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64397.47, 22b/23a bins)
Aug 19 12:48:02 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (852305 bytes, 179 frames, 635 trades)
Aug 19 12:48:03 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (270928 bytes, 179 frames, 110 trades)
Aug 19 12:48:03 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (401792 bytes, 179 frames, 14 trades)
Aug 19 12:48:03 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (335708 bytes, 179 frames, 23 trades)
Aug 19 12:48:04 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1918.78, 34b/43a bins)
Aug 19 12:48:05 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.3395, 102b/102a bins)
Aug 19 12:48:07 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.4145, 251b/252a bins)
Aug 19 12:48:09 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.070047, 101b/101a bins)
Aug 19 12:48:11 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3196541 bytes)
Aug 19 12:49:02 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64397.97, 22b/23a bins)
Aug 19 12:49:02 vmi3467942 node[27456]: kv put book-hires-BTC.json: HTTP 200 (614162 bytes, 179 frames, 472 trades)
Aug 19 12:49:02 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (852253 bytes, 179 frames, 649 trades)
Aug 19 12:49:02 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (271010 bytes, 179 frames, 112 trades)
Aug 19 12:49:02 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (401922 bytes, 179 frames, 14 trades)
Aug 19 12:49:03 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (335823 bytes, 179 frames, 23 trades)
Aug 19 12:49:03 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1919.16, 33b/43a bins)
Aug 19 12:49:05 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.3245, 102b/102a bins)
Aug 19 12:49:06 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.424, 250b/253a bins)
Aug 19 12:49:08 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.07005, 101b/101a bins)
Aug 19 12:49:10 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3196513 bytes)
Aug 19 12:50:03 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64385.65, 22b/25a bins) [10m]
Aug 19 12:50:05 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1918.775, 33b/43a bins) [10m]
Aug 19 12:50:05 vmi3467942 node[27456]: kv put book-hires-BTC.json: HTTP 200 (615144 bytes, 179 frames, 487 trades)
Aug 19 12:50:06 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (851891 bytes, 179 frames, 653 trades)
Aug 19 12:50:06 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.295, 101b/101a bins) [10m]
Aug 19 12:50:06 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (270987 bytes, 179 frames, 113 trades)
Aug 19 12:50:06 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (401980 bytes, 179 frames, 14 trades)
Aug 19 12:50:07 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (335763 bytes, 179 frames, 22 trades)
Aug 19 12:50:08 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.428, 250b/253a bins) [10m]
Aug 19 12:50:09 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.070044, 102b/102a bins) [10m]
Aug 19 12:50:11 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3196507 bytes)
Aug 19 12:50:12 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (721556 bytes)
Aug 19 12:50:13 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (722020 bytes)
Aug 19 12:50:14 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (723796 bytes)
Aug 19 12:50:14 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (727226 bytes)
Aug 19 12:50:16 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (723719 bytes)
Aug 19 12:50:17 vmi3467942 node[27456]: kv put book-live.json: HTTP 200 (4059259 bytes)
Aug 19 12:51:02 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64402.26, 22b/23a bins)
Aug 19 12:51:02 vmi3467942 node[27456]: kv put book-hires-BTC.json: HTTP 200 (615602 bytes, 179 frames, 498 trades)
Aug 19 12:51:03 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (850480 bytes, 179 frames, 637 trades)
Aug 19 12:51:03 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (270974 bytes, 179 frames, 114 trades)
Aug 19 12:51:03 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1919.34, 33b/42a bins)
Aug 19 12:51:03 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (402056 bytes, 179 frames, 14 trades)
Aug 19 12:51:04 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (335801 bytes, 179 frames, 22 trades)
Aug 19 12:51:05 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.3095, 101b/101a bins)
Aug 19 12:51:07 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.453, 251b/252a bins)
Aug 19 12:51:08 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.07005, 101b/101a bins)
Aug 19 12:51:10 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3196440 bytes)
```

## journalctl — cryptomacho-signal (60)
```
Jul 28 11:29:56 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 11:29:56 vmi3467942 systemd[1]: Stopping cryptomacho-signal.service - CryptoMacho OI signal (estagio 2)...
Jul 28 11:29:56 vmi3467942 systemd[1]: cryptomacho-signal.service: Deactivated successfully.
Jul 28 11:29:56 vmi3467942 systemd[1]: Stopped cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 11:29:56 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 11:31:18 vmi3467942 systemd[1]: Stopping cryptomacho-signal.service - CryptoMacho OI signal (estagio 2)...
Jul 28 11:31:18 vmi3467942 systemd[1]: cryptomacho-signal.service: Deactivated successfully.
Jul 28 11:31:18 vmi3467942 systemd[1]: Stopped cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 11:31:18 vmi3467942 systemd[1]: cryptomacho-signal.service: Consumed 6.300s CPU time, 34.5M memory peak, 0B memory swap peak.
Jul 28 11:31:18 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 11:42:20 vmi3467942 systemd[1]: Stopping cryptomacho-signal.service - CryptoMacho OI signal (estagio 2)...
Jul 28 11:42:20 vmi3467942 systemd[1]: cryptomacho-signal.service: Deactivated successfully.
Jul 28 11:42:20 vmi3467942 systemd[1]: Stopped cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 11:42:20 vmi3467942 systemd[1]: cryptomacho-signal.service: Consumed 5.530s CPU time, 34.1M memory peak, 0B memory swap peak.
Jul 28 11:42:20 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 12:02:59 vmi3467942 systemd[1]: Stopping cryptomacho-signal.service - CryptoMacho OI signal (estagio 2)...
Jul 28 12:02:59 vmi3467942 systemd[1]: cryptomacho-signal.service: Deactivated successfully.
Jul 28 12:02:59 vmi3467942 systemd[1]: Stopped cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 12:02:59 vmi3467942 systemd[1]: cryptomacho-signal.service: Consumed 11.504s CPU time, 34.6M memory peak, 0B memory swap peak.
Jul 28 12:02:59 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 12:31:49 vmi3467942 systemd[1]: Stopping cryptomacho-signal.service - CryptoMacho OI signal (estagio 2)...
Jul 28 12:31:49 vmi3467942 systemd[1]: cryptomacho-signal.service: Deactivated successfully.
Jul 28 12:31:49 vmi3467942 systemd[1]: Stopped cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 12:31:49 vmi3467942 systemd[1]: cryptomacho-signal.service: Consumed 25.004s CPU time, 37.8M memory peak, 0B memory swap peak.
Jul 28 12:31:49 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 12:32:43 vmi3467942 systemd[1]: Stopping cryptomacho-signal.service - CryptoMacho OI signal (estagio 2)...
Jul 28 12:32:43 vmi3467942 systemd[1]: cryptomacho-signal.service: Deactivated successfully.
Jul 28 12:32:43 vmi3467942 systemd[1]: Stopped cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 12:32:43 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 12:44:29 vmi3467942 systemd[1]: Stopping cryptomacho-signal.service - CryptoMacho OI signal (estagio 2)...
Jul 28 12:44:29 vmi3467942 systemd[1]: cryptomacho-signal.service: Deactivated successfully.
Jul 28 12:44:29 vmi3467942 systemd[1]: Stopped cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Jul 28 12:44:29 vmi3467942 systemd[1]: cryptomacho-signal.service: Consumed 15.156s CPU time, 45.2M memory peak, 0B memory swap peak.
Jul 28 12:44:30 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Aug 19 12:33:45 vmi3467942 systemd[1]: Stopping cryptomacho-signal.service - CryptoMacho OI signal (estagio 2)...
Aug 19 12:33:45 vmi3467942 systemd[1]: cryptomacho-signal.service: Deactivated successfully.
Aug 19 12:33:45 vmi3467942 systemd[1]: Stopped cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
Aug 19 12:33:45 vmi3467942 systemd[1]: cryptomacho-signal.service: Consumed 17h 24min 50.282s CPU time, 53.2M memory peak, 0B memory swap peak.
Aug 19 12:33:45 vmi3467942 systemd[1]: Started cryptomacho-signal.service - CryptoMacho OI signal (estagio 2).
```

## Base SQLite (backtests)
```
ficheiros .db: /opt/cryptomacho/data.db
--- /opt/cryptomacho/data.db (484M) ---
book_frames
  book_frames: 165915
book_frames span: 2026-07-27 09:01:56 -> 2026-08-19 10:51:07  coins=5
```

## Conectividade as exchanges (a partir da VPS)
```
https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT             200 0.325079s
https://fapi.binance.com/fapi/v1/premiumIndex                            200 0.730856s
https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT   200 0.345689s
https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC 200 0.317126s
https://api.hyperliquid.xyz/info                                         405 0.330069s
https://api.coinalyze.net/v1/exchanges                                   401 0.136201s
https://api.coingecko.com/api/v3/ping                                    200 0.322496s
```

## Backups R2 (timer + ultimo)
```
NEXT                             LEFT LAST                            PASSED UNIT                     ACTIVATES
Wed 2026-08-19 18:20:00 CEST 5h 28min Wed 2026-08-19 12:20:08 CEST 31min ago cryptomacho-backup.timer cryptomacho-backup.service

1 timers listed.
Aug 19 00:21:21 vmi3467942 systemd[1]: cryptomacho-backup.service: Deactivated successfully.
Aug 19 00:21:21 vmi3467942 systemd[1]: Finished cryptomacho-backup.service - Cryptomacho SQLite backup to R2.
Aug 19 00:21:21 vmi3467942 systemd[1]: cryptomacho-backup.service: Consumed 55.234s CPU time.
Aug 19 06:20:00 vmi3467942 systemd[1]: Starting cryptomacho-backup.service - Cryptomacho SQLite backup to R2...
Aug 19 06:21:31 vmi3467942 sh[720749]: NOTICE: Config file "/home/runner/.config/rclone/rclone.conf" not found - using defaults
Aug 19 06:21:41 vmi3467942 sh[720749]: ERROR : cryptomacho-backup.db.gz: Failed to copy: NotImplemented: Not Implemented
Aug 19 06:21:41 vmi3467942 sh[720749]:         status code: 501, request id: , host id:
Aug 19 06:21:41 vmi3467942 sh[720749]: ERROR : Attempt 1/3 failed with 1 errors and: NotImplemented: Not Implemented
Aug 19 06:21:41 vmi3467942 sh[720749]:         status code: 501, request id: , host id:
Aug 19 06:21:41 vmi3467942 sh[720749]: ERROR : Attempt 2/3 succeeded
Aug 19 06:21:41 vmi3467942 sh[720689]: backup ok: book-3-04.db.gz (102M)
Aug 19 06:21:41 vmi3467942 systemd[1]: cryptomacho-backup.service: Deactivated successfully.
Aug 19 06:21:41 vmi3467942 systemd[1]: Finished cryptomacho-backup.service - Cryptomacho SQLite backup to R2.
Aug 19 06:21:41 vmi3467942 systemd[1]: cryptomacho-backup.service: Consumed 1min 29.403s CPU time.
Aug 19 12:20:08 vmi3467942 systemd[1]: Starting cryptomacho-backup.service - Cryptomacho SQLite backup to R2...
Aug 19 12:21:09 vmi3467942 sh[728162]: NOTICE: Config file "/home/runner/.config/rclone/rclone.conf" not found - using defaults
Aug 19 12:21:17 vmi3467942 sh[728162]: ERROR : cryptomacho-backup.db.gz: Failed to copy: NotImplemented: Not Implemented
Aug 19 12:21:17 vmi3467942 sh[728162]:         status code: 501, request id: , host id:
Aug 19 12:21:17 vmi3467942 sh[728162]: ERROR : Attempt 1/3 failed with 1 errors and: NotImplemented: Not Implemented
Aug 19 12:21:17 vmi3467942 sh[728162]:         status code: 501, request id: , host id:
Aug 19 12:21:17 vmi3467942 sh[728162]: ERROR : Attempt 2/3 succeeded
Aug 19 12:21:17 vmi3467942 sh[728105]: backup ok: book-3-10.db.gz (103M)
Aug 19 12:21:17 vmi3467942 systemd[1]: cryptomacho-backup.service: Deactivated successfully.
Aug 19 12:21:17 vmi3467942 systemd[1]: Finished cryptomacho-backup.service - Cryptomacho SQLite backup to R2.
Aug 19 12:21:17 vmi3467942 systemd[1]: cryptomacho-backup.service: Consumed 58.498s CPU time.
```

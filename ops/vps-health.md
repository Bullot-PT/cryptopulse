# VPS health — 2026-08-19 10:21:15Z

## Maquina
```
 12:21:15 up 23 days,  1:34,  0 user,  load average: 2.19, 1.02, 0.74

               total        used        free      shared  buff/cache   available
Mem:           7.8Gi       1.3Gi       5.5Gi       108Mi       1.4Gi       6.5Gi
Swap:             0B          0B          0B

/dev/sda1        96G  6.6G   90G   7% /
Filesystem      Size  Used Avail Use% Mounted on

kernel: 6.8.0-136-generic  node: v22.23.1
```

## Servicos systemd
```
cryptomacho-book                                           active     restarts=0      desde=Tue 2026-07-28 10:58:53 CEST mem=146575360
cryptomacho-oi                                             active     restarts=1      desde=Sat 2026-08-01 11:06:21 CEST mem=195280896
cryptomacho-signal                                         active     restarts=0      desde=Tue 2026-07-28 12:44:30 CEST mem=40607744
regime-rider                                               inactive   restarts=0      desde= mem=[not set]
actions.runner.Bullot-PT-cryptopulse.cryptomacho-vps       active     restarts=0      desde=Fri 2026-07-31 06:18:13 CEST mem=109289472

-- timers --
NEXT                             LEFT LAST                                PASSED UNIT                           ACTIVATES
Wed 2026-08-19 12:30:00 CEST     8min Wed 2026-08-19 12:20:08 CEST   1min 8s ago sysstat-collect.timer          sysstat-collect.service
Wed 2026-08-19 12:56:26 CEST    35min Wed 2026-08-19 11:56:48 CEST     24min ago fwupd-refresh.timer            fwupd-refresh.service
Wed 2026-08-19 17:57:30 CEST 5h 36min Wed 2026-08-19 03:48:16 CEST        8h ago motd-news.timer                motd-news.service
Wed 2026-08-19 21:22:26 CEST       9h Wed 2026-08-19 07:05:16 CEST  5h 16min ago apt-daily.timer                apt-daily.service
Thu 2026-08-20 00:00:00 CEST      11h Wed 2026-08-19 00:00:16 CEST       12h ago dpkg-db-backup.timer           dpkg-db-backup.service
Thu 2026-08-20 00:00:00 CEST      11h Wed 2026-08-19 00:00:16 CEST       12h ago logrotate.timer                logrotate.service
Thu 2026-08-20 00:07:00 CEST      11h Wed 2026-08-19 00:07:16 CEST       12h ago sysstat-summary.timer          sysstat-summary.service
Thu 2026-08-20 02:07:00 CEST      13h Wed 2026-08-19 02:07:00 CEST       10h ago regime-rider.timer             regime-rider.service
Thu 2026-08-20 03:16:25 CEST      14h Wed 2026-08-19 01:49:30 CEST       10h ago man-db.timer                   man-db.service
Thu 2026-08-20 04:00:00 CEST      15h Wed 2026-08-19 04:00:00 CEST        8h ago regime-rider-watchdog.timer    regime-rider-watchdog.service
Thu 2026-08-20 06:37:35 CEST      18h Wed 2026-08-19 06:02:38 CEST        6h ago apt-daily-upgrade.timer        apt-daily-upgrade.service
Thu 2026-08-20 10:53:38 CEST      22h Wed 2026-08-19 10:53:38 CEST  1h 27min ago update-notifier-download.timer update-notifier-download.service
Thu 2026-08-20 11:03:38 CEST      22h Wed 2026-08-19 11:03:38 CEST  1h 17min ago systemd-tmpfiles-clean.timer   systemd-tmpfiles-clean.service
Sun 2026-08-23 03:10:12 CEST   3 days Sun 2026-08-16 03:10:16 CEST    3 days ago e2scrub_all.timer              e2scrub_all.service
Mon 2026-08-24 00:46:28 CEST   4 days Mon 2026-08-17 00:38:45 CEST    2 days ago fstrim.timer                   fstrim.service
Tue 2026-08-25 08:38:08 CEST   5 days Mon 2026-08-17 22:30:36 CEST 1 day 13h ago update-notifier-motd.timer     update-notifier-motd.service
-                                   - -                                        - apport-autoreport.timer        apport-autoreport.service
-                                   - Wed 2026-08-19 12:20:08 CEST   1min 8s ago cryptomacho-backup.timer       cryptomacho-backup.service
-                                   - -                                        - snapd.snap-repair.timer        snapd.snap-repair.service
```

## Ficheiros data/ na VPS (mtime = ultima escrita real)
### /opt/cryptomacho/oi/data
```
total 11788
drwxr-xr-x 2 runner runner    4096 2026-08-19_12:20 .
drwxr-xr-x 3 runner runner    4096 2026-07-27_12:50 ..
-rw-r--r-- 1 runner runner   11614 2026-07-27_12:50 _kdebug.json
-rw-r--r-- 1 runner runner    4478 2026-07-27_12:50 alert-log.json
-rw-r--r-- 1 runner runner    2181 2026-07-27_12:50 alert-state.json
-rw-r--r-- 1 runner runner 2113086 2026-07-27_12:50 backtest-3y.json
-rw-r--r-- 1 runner runner   94421 2026-08-19_12:20 cg-mirror.json
-rw-r--r-- 1 runner runner    6364 2026-08-19_12:19 hl-ls.json
-rw-r--r-- 1 runner runner  106681 2026-08-19_12:19 hl-pos.json
-rw-r--r-- 1 runner runner  658378 2026-08-19_12:19 hl-seen.json
-rw-r--r-- 1 runner runner   38795 2026-08-19_12:20 hl-wallets.json
-rw-r--r-- 1 runner runner  891565 2026-08-19_12:20 kalshi.json
-rw-r--r-- 1 runner runner  228275 2026-08-19_12:20 liq-book-lighter.json
-rw-r--r-- 1 runner runner   30667 2026-08-19_12:19 liq-book.json
-rw-r--r-- 1 runner runner  112007 2026-07-27_12:50 liq-totals.json
-rw-r--r-- 1 runner runner     801 2026-07-27_12:50 nansen-budget.json
-rw-r--r-- 1 runner runner 1246585 2026-07-27_12:50 nansen-labels.json
-rw-r--r-- 1 runner runner  334397 2026-07-27_12:50 nansen-names.json
-rw-r--r-- 1 runner runner  184355 2026-07-27_12:50 nansen-perps.json
-rw-r--r-- 1 runner runner   13973 2026-07-27_12:50 nansen-sm.json
-rw-r--r-- 1 runner runner 5854951 2026-08-19_12:20 oi-history.json
-rw-r--r-- 1 runner runner   63081 2026-07-27_12:50 radar-history.json
-rw-r--r-- 1 runner runner   18992 2026-08-19_12:20 upbit.json
```
### /opt/cryptomacho (book) 
```
total 499112
drwxr-xr-x 6 runner runner      4096 2026-07-28_11:29 .
drwxr-xr-x 4 root   root        4096 2026-07-28_10:57 ..
-rw-r--r-- 1 runner runner     19534 2026-07-28_10:58 book-collector.mjs
drwxr-xr-x 2 runner runner      4096 2026-07-27_10:45 data
-rw-r--r-- 1 runner runner 506834944 2026-08-19_12:09 data.db
-rw-r--r-- 1 runner runner     32768 2026-08-19_12:21 data.db-shm
-rw-r--r-- 1 runner runner   4148872 2026-08-19_12:21 data.db-wal
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
Aug 19 11:30:13 vmi3467942 sh[727082]: coinalyze 429, waiting 7.823s
Aug 19 11:30:16 vmi3467942 sh[727082]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 11:30:19 vmi3467942 sh[727082]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 11:30:24 vmi3467942 sh[727082]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 11:30:24 vmi3467942 sh[727082]: kalshi sample titles: Will Renaud Lefevre win the Krstic vs Lefevre: M15 Kursumlijska Banja Round of 32 match? | Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match?
Aug 19 11:30:28 vmi3467942 sh[727082]: hl-wallets.json: 700 wallets
Aug 19 11:34:30 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 11:34:30 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 11:34:31 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 11:34:31 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 11:34:31 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 11:34:32 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 11:34:33 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 11:34:33 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 11:35:00 vmi3467942 sh[162184]: --- pass at 09:35:00Z ---
Aug 19 11:35:06 vmi3467942 sh[727174]: global OI: $179.34B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 11:35:09 vmi3467942 sh[727174]: OI samples stored: 2293
Aug 19 11:35:12 vmi3467942 sh[727174]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 11:35:13 vmi3467942 sh[727174]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 11:35:21 vmi3467942 sh[727174]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 11:35:21 vmi3467942 sh[727174]: kalshi sample titles: Will Renaud Lefevre win the Krstic vs Lefevre: M15 Kursumlijska Banja Round of 32 match? | Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match?
Aug 19 11:35:25 vmi3467942 sh[727174]: hl-wallets.json: 700 wallets
Aug 19 11:35:40 vmi3467942 sh[727174]: coinalyze 429, waiting 30.656s
Aug 19 11:39:28 vmi3467942 sh[727174]: hl-ls.json: 500 of 500 wallets · 48.5% long · 265 coins
Aug 19 11:39:28 vmi3467942 sh[727174]: wallet scan: 1895 addresses — 800 core + 500 rotating + 250 from the trade feed + 345 re-read because they are on screen
Aug 19 11:39:28 vmi3467942 sh[727174]: trade-feed harvest: 249 addresses on 30 coins, 24 new · pool 9893 (218 proven holders) · 250 read this pass, 102 holding
Aug 19 11:39:28 vmi3467942 sh[727174]: liq-book: 1895 wallets, 1465 positions, 153 coins
Aug 19 11:39:28 vmi3467942 sh[727174]: hl-pos: 141 coins, 569 addresses, coverage 41% of OI, 0 carried, rotation at 3540 of 14200, 104KB
Aug 19 11:39:31 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 11:39:31 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 11:39:31 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 11:39:32 vmi3467942 sh[162184]: kv put hl-ls.json: HTTP 200
Aug 19 11:39:32 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 11:39:32 vmi3467942 sh[162184]: kv put hl-seen.json: HTTP 200
Aug 19 11:39:33 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 11:39:33 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 11:39:34 vmi3467942 sh[162184]: kv put liq-book.json: HTTP 200
Aug 19 11:39:36 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 11:39:36 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 11:40:00 vmi3467942 sh[162184]: --- pass at 09:40:00Z ---
Aug 19 11:40:09 vmi3467942 sh[727278]: global OI: $179.21B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 11:40:12 vmi3467942 sh[727278]: OI samples stored: 2294
Aug 19 11:40:12 vmi3467942 sh[727278]: coinalyze 429, waiting 7.643s
Aug 19 11:40:15 vmi3467942 sh[727278]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 11:40:17 vmi3467942 sh[727278]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 11:40:25 vmi3467942 sh[727278]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 11:40:25 vmi3467942 sh[727278]: kalshi sample titles: Will Renaud Lefevre win the Krstic vs Lefevre: M15 Kursumlijska Banja Round of 32 match? | Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match?
Aug 19 11:40:29 vmi3467942 sh[727278]: hl-wallets.json: 700 wallets
Aug 19 11:44:30 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 11:44:31 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 11:44:31 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 11:44:31 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 11:44:32 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 11:44:32 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 11:44:34 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 11:44:34 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 11:45:00 vmi3467942 sh[162184]: --- pass at 09:45:00Z ---
Aug 19 11:45:06 vmi3467942 sh[727375]: global OI: $179.07B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 11:45:08 vmi3467942 sh[727375]: OI samples stored: 2293
Aug 19 11:45:08 vmi3467942 sh[727375]: coinalyze 429, waiting 23.146s
Aug 19 11:45:12 vmi3467942 sh[727375]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 11:45:15 vmi3467942 sh[727375]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 11:45:23 vmi3467942 sh[727375]: kalshi events: 1500 withPrice: 1496 umbrella: 57 eventTitles: 4000
Aug 19 11:45:23 vmi3467942 sh[727375]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Beatrise Zeltina win the Kovackova vs Zeltina: W50 Prague Round of 16 match?
Aug 19 11:45:30 vmi3467942 sh[727375]: hl-wallets.json: 700 wallets
Aug 19 11:49:31 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 11:49:31 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 11:49:32 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 11:49:32 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 11:49:32 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 11:49:33 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 11:49:35 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 11:49:35 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 11:50:00 vmi3467942 sh[162184]: --- pass at 09:50:00Z ---
Aug 19 11:50:06 vmi3467942 sh[727470]: global OI: $179.07B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 11:50:08 vmi3467942 sh[727470]: OI samples stored: 2294
Aug 19 11:50:11 vmi3467942 sh[727470]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 11:50:13 vmi3467942 sh[727470]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 11:50:22 vmi3467942 sh[727470]: kalshi events: 1500 withPrice: 1496 umbrella: 58 eventTitles: 4000
Aug 19 11:50:22 vmi3467942 sh[727470]: kalshi sample titles: Florida Republican Governor primary: voter turnout | BTC price up in next 15 mins? | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match?
Aug 19 11:50:27 vmi3467942 sh[727470]: hl-wallets.json: 700 wallets
Aug 19 11:50:39 vmi3467942 sh[727470]: coinalyze 429, waiting 30.67s
Aug 19 11:54:31 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 11:54:31 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 11:54:32 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 11:54:32 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 11:54:33 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 11:54:33 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 11:54:34 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 11:54:35 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 11:55:00 vmi3467942 sh[162184]: --- pass at 09:55:00Z ---
Aug 19 11:55:05 vmi3467942 sh[727563]: global OI: $178.71B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 11:55:06 vmi3467942 sh[727563]: OI samples stored: 2293
Aug 19 11:55:07 vmi3467942 sh[727563]: coinalyze 429, waiting 12.708s
Aug 19 11:55:10 vmi3467942 sh[727563]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 11:55:11 vmi3467942 sh[727563]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 11:55:19 vmi3467942 sh[727563]: kalshi events: 1500 withPrice: 1496 umbrella: 60 eventTitles: 4000
Aug 19 11:55:19 vmi3467942 sh[727563]: kalshi sample titles: Florida Republican Governor primary: voter turnout | BTC price up in next 15 mins? | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match?
Aug 19 11:55:23 vmi3467942 sh[727563]: hl-wallets.json: 700 wallets
Aug 19 11:59:26 vmi3467942 sh[727563]: hl-ls.json: 500 of 500 wallets · 48.5% long · 265 coins
Aug 19 11:59:26 vmi3467942 sh[727563]: wallet scan: 1900 addresses — 800 core + 500 rotating + 250 from the trade feed + 350 re-read because they are on screen
Aug 19 11:59:26 vmi3467942 sh[727563]: trade-feed harvest: 215 addresses on 30 coins, 14 new · pool 9874 (218 proven holders) · 250 read this pass, 111 holding
Aug 19 11:59:26 vmi3467942 sh[727563]: liq-book: 1900 wallets, 1468 positions, 153 coins
Aug 19 11:59:26 vmi3467942 sh[727563]: hl-pos: 141 coins, 572 addresses, coverage 41% of OI, 0 carried, rotation at 4040 of 14200, 104KB
Aug 19 11:59:31 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 11:59:31 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 11:59:32 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 11:59:32 vmi3467942 sh[162184]: kv put hl-ls.json: HTTP 200
Aug 19 11:59:33 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 11:59:33 vmi3467942 sh[162184]: kv put hl-seen.json: HTTP 200
Aug 19 11:59:33 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 11:59:34 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 11:59:34 vmi3467942 sh[162184]: kv put liq-book.json: HTTP 200
Aug 19 11:59:36 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 11:59:36 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 12:00:00 vmi3467942 sh[162184]: --- pass at 10:00:00Z ---
Aug 19 12:00:22 vmi3467942 sh[727680]: global OI: $179.01B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:00:24 vmi3467942 sh[727680]: OI samples stored: 2294
Aug 19 12:00:25 vmi3467942 sh[727680]: coinalyze 429, waiting 5.916s
Aug 19 12:00:28 vmi3467942 sh[727680]: cg mirror: 8 trending, 250 markets, global ok
Aug 19 12:00:30 vmi3467942 sh[727680]: upbit: 283 KRW markets, 18 flagged, 191 mapped, 20 notices, 17 recent events
Aug 19 12:00:41 vmi3467942 sh[727680]: kalshi events: 1500 withPrice: 1498 umbrella: 64 eventTitles: 4000
Aug 19 12:00:41 vmi3467942 sh[727680]: kalshi sample titles: Florida Republican Governor primary: voter turnout | Will Oleksii Krutykh win the Krutykh vs Hardt: Round Of 16 match? | Will Tomas Quesada Perez win the Fernandes vs Quesada Perez: M25 Idanha-a-Nova Round of 32 match?
Aug 19 12:00:46 vmi3467942 sh[727680]: hl-wallets.json: 700 wallets
Aug 19 12:04:30 vmi3467942 sh[162184]: collector saiu com erro/timeout nesta passagem — continuo
Aug 19 12:04:31 vmi3467942 sh[162184]: kv put alert-log.json: HTTP 200
Aug 19 12:04:32 vmi3467942 sh[162184]: kv put cg-mirror.json: HTTP 200
Aug 19 12:04:32 vmi3467942 sh[162184]: kv put hl-pos.json: HTTP 200
Aug 19 12:04:32 vmi3467942 sh[162184]: kv put hl-wallets.json: HTTP 200
Aug 19 12:04:33 vmi3467942 sh[162184]: kv put kalshi.json: HTTP 200
Aug 19 12:04:34 vmi3467942 sh[162184]: kv put oi-history.json: HTTP 200
Aug 19 12:04:34 vmi3467942 sh[162184]: kv put upbit.json: HTTP 200
Aug 19 12:05:00 vmi3467942 sh[162184]: --- pass at 10:05:00Z ---
Aug 19 12:05:07 vmi3467942 sh[727776]: global OI: $178.82B — 5 perp DEXes measured directly (99 CG rows)
Aug 19 12:05:09 vmi3467942 sh[727776]: OI samples stored: 2294
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
```

## journalctl — cryptomacho-book (60)
```
Aug 19 12:17:02 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64371.575, 21b/23a bins)
Aug 19 12:17:02 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (879201 bytes, 180 frames, 762 trades)
Aug 19 12:17:02 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (274690 bytes, 180 frames, 136 trades)
Aug 19 12:17:03 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (403404 bytes, 180 frames, 19 trades)
Aug 19 12:17:03 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (337708 bytes, 180 frames, 32 trades)
Aug 19 12:17:04 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1918.245, 33b/45a bins)
Aug 19 12:17:05 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.2435, 101b/101a bins)
Aug 19 12:17:07 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.2135, 250b/252a bins)
Aug 19 12:17:08 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.069997, 101b/101a bins)
Aug 19 12:17:10 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3167885 bytes)
Aug 19 12:18:02 vmi3467942 node[27456]: kv put book-hires-BTC.json: HTTP 200 (612788 bytes, 180 frames, 446 trades)
Aug 19 12:18:02 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64373.475, 20b/23a bins)
Aug 19 12:18:02 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (878536 bytes, 180 frames, 755 trades)
Aug 19 12:18:02 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (275114 bytes, 180 frames, 146 trades)
Aug 19 12:18:02 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (403321 bytes, 180 frames, 17 trades)
Aug 19 12:18:02 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (337709 bytes, 180 frames, 32 trades)
Aug 19 12:18:03 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1918.32, 33b/46a bins)
Aug 19 12:18:05 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.274, 102b/102a bins)
Aug 19 12:18:07 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.1995, 251b/252a bins)
Aug 19 12:18:08 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.070009, 102b/101a bins)
Aug 19 12:18:10 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3167837 bytes)
Aug 19 12:19:02 vmi3467942 node[27456]: kv put book-hires-BTC.json: HTTP 200 (612586 bytes, 180 frames, 440 trades)
Aug 19 12:19:02 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64374.925, 20b/22a bins)
Aug 19 12:19:02 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (878122 bytes, 180 frames, 757 trades)
Aug 19 12:19:03 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (275004 bytes, 180 frames, 146 trades)
Aug 19 12:19:03 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (403396 bytes, 180 frames, 17 trades)
Aug 19 12:19:03 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (337793 bytes, 180 frames, 33 trades)
Aug 19 12:19:04 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1918.45, 33b/45a bins)
Aug 19 12:19:05 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.2835, 102b/102a bins)
Aug 19 12:19:07 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.2365, 251b/252a bins)
Aug 19 12:19:08 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.070009, 102b/101a bins)
Aug 19 12:19:10 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3167772 bytes)
Aug 19 12:20:05 vmi3467942 node[27456]: kv put book-hires-BTC.json: HTTP 200 (612525 bytes, 180 frames, 433 trades)
Aug 19 12:20:05 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64374.925, 20b/22a bins) [10m]
Aug 19 12:20:05 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (876827 bytes, 180 frames, 747 trades)
Aug 19 12:20:06 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (274761 bytes, 180 frames, 142 trades)
Aug 19 12:20:06 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (403416 bytes, 180 frames, 16 trades)
Aug 19 12:20:06 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (337849 bytes, 180 frames, 34 trades)
Aug 19 12:20:07 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1918.64, 33b/45a bins) [10m]
Aug 19 12:20:09 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.2835, 102b/102a bins) [10m]
Aug 19 12:20:11 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.267, 251b/253a bins) [10m]
Aug 19 12:20:12 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.070009, 102b/101a bins) [10m]
Aug 19 12:20:17 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3182098 bytes)
Aug 19 12:20:20 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (689991 bytes)
Aug 19 12:20:21 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (691219 bytes)
Aug 19 12:20:21 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (694223 bytes)
Aug 19 12:20:22 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (700654 bytes)
Aug 19 12:20:22 vmi3467942 node[27456]: kv put book-arch-20260817.json: HTTP 200 (703574 bytes)
Aug 19 12:20:23 vmi3467942 node[27456]: kv put book-live.json: HTTP 200 (4059209 bytes)
Aug 19 12:21:02 vmi3467942 node[27456]: kv put book-hires-BTC.json: HTTP 200 (614294 bytes, 180 frames, 455 trades)
Aug 19 12:21:03 vmi3467942 node[27456]: BTC: frame ok (BN+BNP+OKX+BY+HL, px 64376.66, 21b/22a bins)
Aug 19 12:21:03 vmi3467942 node[27456]: kv put book-hires-ETH.json: HTTP 200 (876359 bytes, 180 frames, 753 trades)
Aug 19 12:21:03 vmi3467942 node[27456]: kv put book-hires-SOL.json: HTTP 200 (274693 bytes, 180 frames, 140 trades)
Aug 19 12:21:04 vmi3467942 node[27456]: kv put book-hires-HYPE.json: HTTP 200 (403365 bytes, 180 frames, 13 trades)
Aug 19 12:21:04 vmi3467942 node[27456]: kv put book-hires-DOGE.json: HTTP 200 (337828 bytes, 180 frames, 34 trades)
Aug 19 12:21:05 vmi3467942 node[27456]: ETH: frame ok (BN+BNP+OKX+BY+HL, px 1918.515, 33b/45a bins)
Aug 19 12:21:06 vmi3467942 node[27456]: SOL: frame ok (BN+BNP+OKX+BY+HL, px 77.2835, 102b/102a bins)
Aug 19 12:21:08 vmi3467942 node[27456]: HYPE: frame ok (BN+BNP+OKX+BY+HL, px 58.269, 250b/252a bins)
Aug 19 12:21:09 vmi3467942 node[27456]: DOGE: frame ok (BN+BNP+OKX+BY+HL, px 0.070022, 102b/102a bins)
Aug 19 12:21:12 vmi3467942 node[27456]: kv put book-fine.json: HTTP 200 (3182060 bytes)
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
```

## Base SQLite (backtests)
```
ficheiros .db: /opt/cryptomacho/data.db
--- /opt/cryptomacho/data.db (484M) ---
book_frames
  book_frames: 165765
book_frames span: 2026-07-27 09:01:56 -> 2026-08-19 10:21:08  coins=5
```

## Conectividade as exchanges (a partir da VPS)
```
https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT             200 0.339698s
https://fapi.binance.com/fapi/v1/premiumIndex                            200 1.442895s
https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT   200 0.441489s
https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=BTC 200 0.483281s
https://api.hyperliquid.xyz/info                                         405 0.402954s
https://api.coinalyze.net/v1/exchanges                                   401 0.123829s
https://api.coingecko.com/api/v3/ping                                    200 0.224838s
```

## Backups R2 (timer + ultimo)
```
NEXT                             LEFT LAST                               PASSED UNIT                     ACTIVATES
Wed 2026-08-19 18:20:00 CEST 5h 58min Wed 2026-08-19 12:20:08 CEST 1min 12s ago cryptomacho-backup.timer cryptomacho-backup.service

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

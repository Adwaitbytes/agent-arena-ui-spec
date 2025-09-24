<div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="flex items-center justify-between mb-6"
  >
    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight flex items-center gap-2">
      <Trophy className="size-6 text-chart-4" />
      Leaderboard
    </h1>
    <div className="flex flex-wrap gap-2">
      {seasons.map((s) => (
        <Button key={s} asChild variant={s === season ? "default" : "secondary"}>
          <Link href={`/leaderboard/${s}`}>S{s}</Link>
        </Button>
      ))}
    </div>
  </motion.div>
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="mt-6"
  >
    <LeaderboardClient season={season} />
  </motion.div>
</div>
# Using Monte Carlo Simulation Tool to Visualize Poker Variance

##### Steve Gregoire - steveg93@gmail.com


As both a software developer and a committed poker player, I wanted to better understand the role of variance in my long-term poker results. After recording hundreds of hours of live play, I found that even with a positive win rate, the short-term fluctuations in bankroll could be concerning. I needed a tool that would help me visualize the range of possible outcomes over time—something that could help me contextualize the swings I was experiencing.

So, I wrote a Monte Carlo simulation program in Python to do just that.

---

## Purpose and Functionality

The goal of the program is to simulate long-term poker results using historical performance statistics. The user provides four inputs:

- **Starting bankroll** amount of money allocated to poker. Used to calculate the risk of losing your entire bankroll
- **Hourly win rate** total winning amount divided by hours of play
- **Standard deviation** of hourly wins/losses  
- **Number of hours** to simulate  
- **Number of simulations** to run (defaults to 1,000)  

Using these parameters, the program runs multiple simulations of poker sessions, projecting potential bankroll trajectories over the specified time horizon. Each simulation is visualized as a line graph: the line goes up when you win and down when you lose. The result is a powerful, data-driven visualization of the variance poker players can expect—even when they have a solid edge.

---

## Visualization and Confidence Intervals

The visualization is built using the `matplotlib` library, which is included in standard Python installations. In addition to plotting individual simulation paths, the chart also includes a shaded **95% confidence interval**. 

---

## More Data the Better

The quality of the simulation is only as good as the data you feed into it. To get meaningful projections, players must diligently record the results of every session they play—wins and losses alike. The more data you collect, the more accurately your win rate and standard deviation will reflect your past and future results.

I recommend a Google Sheet to track your poker results. Capture these fields at a minimum

| Date | Stakes | Location | Buy in | Cash out | Hours | Win/Lose | Earn Per Hour |
|:---|:---|:---|-------:|---------:|------:|---------:|--------------:|
| 10/16/2022 | 1-3 | Encore | \$300 | \$300 | 5 | \$0 | \$0 |
| 11/11/2022 | 1-3 | Encore | \$600 | \$928 | 3 | \$328 | \$109 |
| 11/13/2022 | 1-3 | Encore | \$500 | \$951 | 3.75 | \$451 | \$120 |
| 11/15/2022 | 1-3 | Encore | \$700 | \$453 | 3 | -\$247 | -\$82 |


It’s also worth noting that for players who haven’t logged many hours, their statistics will likely evolve over time—especially if they are actively working to improve through study and review. The tool doesn't predict improvement; it models outcomes based on your current measured performance. 

---

## Final Thoughts

This project is a direct result of combining my passion for poker with my background in software development. It’s a practical tool that has helped me manage expectations and maintain the perspective required to poker with a long-term mindset. 


export interface AggregationOptions {
  groupBy?: "hour" | "day" | "week" | "month" | "country" | "device" | "browser" | "os";
  timeRange?: { start: Date; end: Date };
  filters?: Record<string, string | string[]>;
  metrics: ("clicks" | "unique_visitors" | "bot_hits" | "revenue")[];
}

export class DataAggregationEngine {
  private rawData: any[];

  constructor(rawData: any[] = []) {
    this.rawData = rawData;
  }

  public updateData(newData: any[]) {
    this.rawData = [...this.rawData, ...newData];
  }

  public aggregate(options: AggregationOptions) {
    let filteredData = this.rawData;

    // Apply time range
    if (options.timeRange) {
      const { start, end } = options.timeRange;
      filteredData = filteredData.filter((d) => {
        const time = new Date(d.timestamp).getTime();
        return time >= start.getTime() && time <= end.getTime();
      });
    }

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, val]) => {
        filteredData = filteredData.filter((d) => {
          if (Array.isArray(val)) return val.includes(d[key]);
          return d[key] === val;
        });
      });
    }

    // Grouping
    const groups: Record<string, any> = {};

    filteredData.forEach((d) => {
      let groupKey = "All";
      
      if (options.groupBy) {
        if (["hour", "day", "week", "month"].includes(options.groupBy)) {
          const date = new Date(d.timestamp);
          if (options.groupBy === "hour") groupKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          if (options.groupBy === "day") groupKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          if (options.groupBy === "month") groupKey = `${date.getFullYear()}-${date.getMonth()}`;
        } else {
          groupKey = d[options.groupBy] || "Unknown";
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = { key: groupKey };
        options.metrics.forEach((m) => (groups[groupKey][m] = 0));
      }

      options.metrics.forEach((m) => {
        if (d[m] !== undefined) {
          groups[groupKey][m] += d[m];
        } else {
          // Default increment if metric is just a count representation like 'clicks'
          if (m === "clicks") groups[groupKey][m] += 1;
        }
      });
    });

    return Object.values(groups);
  }

  // Specialized analytic queries for the dashboard
  public getLineChartData() {
    return this.aggregate({
      groupBy: "day",
      metrics: ["clicks"],
    }).map(g => ({
      timestamp: new Date(g.key.split('-').map(Number).join('-')).getTime(),
      value: g.clicks,
      category: "Total Clicks"
    }));
  }

  public getGeoData() {
    const agg = this.aggregate({
      groupBy: "country",
      metrics: ["clicks"]
    });
    // Normally would map country to lat/lng
    return agg.map((g, i) => ({
      id: g.key,
      label: g.key,
      lat: (Math.random() - 0.5) * 160,
      lng: (Math.random() - 0.5) * 360,
      value: g.clicks
    }));
  }
}

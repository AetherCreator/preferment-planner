export function calculateBakersPercentage(part: number, total: number): number {
  return (part / total) * 100;
}

export function toFahrenheit(celsius: number): number {
  return celsius * 9 / 5 + 32;
}

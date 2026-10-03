// Aceita apenas caminhos internos. Barras invertidas são tratadas como "/"
// pelos navegadores, então "/\evil.com" viraria um redirecionamento externo.
export function safeNextPath(value: string | null | undefined, fallback = "/app") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

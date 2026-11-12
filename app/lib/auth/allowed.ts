// Quem pode entrar na área restrita. Mesmo com o cadastro público fechado no
// Neon, o código só libera os e-mails desta lista (env ALLOWED_EMAILS,
// separados por vírgula). Lista vazia = ninguém entra.
export function allowedEmails() {
  return (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false
  return allowedEmails().includes(email.trim().toLowerCase())
}

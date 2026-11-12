const MAX_RETRIES = 5

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchHygraphQuery = async <T>(
  query: string,
  revalidate?: number,
  variables?: Record<string, unknown>,
): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(process.env.HYGRAPH_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.HYGRAPH_TOKEN}`,
      },
      // A tag deixa o webhook (app/api/revalidate) invalidar tudo de uma vez;
      // o revalidate por tempo fica de reserva.
      next: {
        revalidate,
        tags: ['hygraph'],
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    // O plano gratuito do Hygraph limita requisições por segundo; o build
    // gera páginas em paralelo, então espera e tenta de novo.
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = Number(response.headers.get('retry-after'))
      const delay =
        retryAfter > 0
          ? retryAfter * 1000
          : 500 * 2 ** attempt + Math.random() * 250
      await sleep(delay)
      continue
    }

    if (!response.ok) {
      throw new Error(
        `Hygraph respondeu ${response.status} ${response.statusText}`,
      )
    }

    const { data, errors } = await response.json()

    if (errors?.length) {
      throw new Error(
        `Erro na query do Hygraph: ${errors.map((e: { message: string }) => e.message).join('; ')}`,
      )
    }

    return data
  }
}

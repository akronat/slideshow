type PromiseAnyResult<T> = {
  /** The values of the fulfilled promises */
  values: T[];
  /** The reasons of the rejected promises */
  reasons: any[];
}

async function promiseAny<T>(promises: Promise<T>[]): Promise<PromiseAnyResult<T>> {
  const results = await Promise.allSettled(promises);
  const values: T[] = [];
  const reasons: any[] = [];
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      values.push(r.value);
    } else {
      reasons.push(r.reason);
    }
  });
  return { values, reasons };
}

export default promiseAny;

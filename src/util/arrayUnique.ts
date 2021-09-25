
/**
 * Uniqify a given array.
 * @param {*[]} arr The array to uniqify.
 * @param {function} [keyFunc] The function to determine the
 *  unique "key" for each item.
 * @returns A copy of the array, but without duplicates.
 */
const arrayUnique = <T>(arr: T[], keyFunc?: (item: T) => any) =>
  Array.from(arr.reduce((result, item) => {
    const key = (keyFunc && keyFunc(item)) || item;
    result.set(key, item);
    return result;
  }, new Map<any, T>()).values());

export default arrayUnique;

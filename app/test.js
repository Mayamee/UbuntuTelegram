function splitByCounter(str, quantity) {
  if (typeof str !== "string") return null;
  if (str.length > quantity) {
    const { length } = str;
    const delimiter = ~~(length / quantity);
    const remind = length % quantity;
    const acc = [];
    for (let i = 0; i < delimiter; i++) {
      const substring = str.substring(i * quantity, (i + 1) * quantity);
      acc.push(substring);
    }
    acc.push(str.substring(length - remind));
    return acc.filter((e) => e);
  } else {
    return [str];
  }
}
console.log(splitByCounter(test, 4096));

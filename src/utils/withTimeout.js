// Promise-д timeout нэмнэ — AI дуудлага гацахаас сэргийлнэ
export function withTimeout(promise, ms = 30000, label = "AI хариу") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} ${ms / 1000} секундэд ирсэнгүй`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
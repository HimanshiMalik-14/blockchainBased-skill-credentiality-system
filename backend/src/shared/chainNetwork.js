export function guessNetworkName(chainId) {
  const id = Number(chainId);
  if (!Number.isFinite(id)) return null;
  if (id === 1 || id === 11155111) return "ethereum";
  if (id === 137 || id === 80002 || id === 80001) return "polygon";
  return null;
}


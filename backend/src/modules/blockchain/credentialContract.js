import { ethers } from "ethers";
import { env } from "../../shared/env.js";
import { HttpError } from "../../shared/httpError.js";
import { SkillCredentialRegistryABI } from "./SkillCredentialRegistry.abi.js";

function assertChainEnv() {
  if (!env.CHAIN_RPC_URL || !env.CONTRACT_ADDRESS || !env.RELAYER_PRIVATE_KEY) {
    throw new HttpError(
      500,
      "Blockchain is not configured",
      "Set CHAIN_RPC_URL, CONTRACT_ADDRESS, and RELAYER_PRIVATE_KEY"
    );
  }
}

export function isChainConfigured() {
  return !!(env.CHAIN_RPC_URL && env.CONTRACT_ADDRESS && env.RELAYER_PRIVATE_KEY);
}

export function getProvider() {
  assertChainEnv();
  return new ethers.JsonRpcProvider(env.CHAIN_RPC_URL, env.CHAIN_ID ? Number(env.CHAIN_ID) : undefined);
}

export function getRelayerSigner() {
  const provider = getProvider();
  return new ethers.Wallet(env.RELAYER_PRIVATE_KEY, provider);
}

export function getCredentialContract() {
  const signer = getRelayerSigner();
  return new ethers.Contract(env.CONTRACT_ADDRESS, SkillCredentialRegistryABI, signer);
}

export function keccak256HexUtf8(input) {
  return ethers.keccak256(ethers.toUtf8Bytes(input));
}


// ABI for contracts/SkillCredentialRegistry.sol
// Kept as JS (not JSON) to avoid Node ESM JSON import friction.
export const SkillCredentialRegistryABI = [
  "function issueCertificate(bytes32 credentialHash, address learner, string uri) external",
  "function verifyCertificate(bytes32 credentialHash) external view returns (bool)",
  "function getCertificate(bytes32 credentialHash) external view returns (address issuer, address learner, uint64 issuedAt, bool revoked, string uri)",
  "event CredentialIssued(bytes32 indexed credentialHash, address indexed learner, address indexed issuer, string uri, uint64 issuedAt)",
  "event CredentialRevoked(bytes32 indexed credentialHash, address indexed revokedBy, uint64 revokedAt)"
];


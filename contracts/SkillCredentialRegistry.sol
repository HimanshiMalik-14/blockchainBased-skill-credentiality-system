// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title SkillCredentialRegistry
/// @notice Minimal on-chain registry for tamper-evident skill credentials.
/// @dev Stores only a credential hash + minimal metadata; full certificate data stays off-chain.
contract SkillCredentialRegistry is AccessControl, Pausable {
    /// @dev Role for approved issuers (institutions).
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    /// @dev Thrown when attempting to issue a credential that already exists.
    error CredentialAlreadyExists(bytes32 credentialHash);
    /// @dev Thrown when attempting to query a credential that doesn't exist.
    error CredentialNotFound(bytes32 credentialHash);
    /// @dev Thrown when attempting to issue a zero hash.
    error InvalidCredentialHash();
    /// @dev Thrown when a non-admin tries to revoke another issuer's credential.
    error NotCredentialIssuer(address caller, address expectedIssuer);

    struct Credential {
        address issuer;
        address learner;
        uint64 issuedAt;
        bool revoked;
        // Optional pointer to off-chain metadata (IPFS CID / HTTPS URL). Keep this short.
        string uri;
    }

    /// @notice Mapping of credential hash => credential record.
    mapping(bytes32 => Credential) private _credentials;

    /// @notice Emitted when a credential is issued.
    event CredentialIssued(
        bytes32 indexed credentialHash,
        address indexed learner,
        address indexed issuer,
        string uri,
        uint64 issuedAt
    );

    /// @notice Emitted when a credential is revoked.
    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed revokedBy,
        uint64 revokedAt
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        // Admin can also act as issuer initially (optional; can be revoked later).
        _grantRole(ISSUER_ROLE, admin);
    }

    /// @notice Pause issuing/revoking (verification still works).
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause issuing/revoking.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// @notice Issue a new credential.
    /// @param credentialHash Hash of the canonical certificate data (e.g., keccak256 of JSON/PDF digest).
    /// @param learner Address representing the credential owner (can be a wallet or a placeholder address).
    /// @param uri Optional off-chain metadata URI (IPFS CID or HTTPS URL).
    function issueCertificate(bytes32 credentialHash, address learner, string calldata uri)
        external
        whenNotPaused
        onlyRole(ISSUER_ROLE)
    {
        if (credentialHash == bytes32(0)) revert InvalidCredentialHash();

        Credential storage existing = _credentials[credentialHash];
        if (existing.issuedAt != 0) revert CredentialAlreadyExists(credentialHash);

        uint64 ts = uint64(block.timestamp);
        _credentials[credentialHash] = Credential({
            issuer: msg.sender,
            learner: learner,
            issuedAt: ts,
            revoked: false,
            uri: uri
        });

        emit CredentialIssued(credentialHash, learner, msg.sender, uri, ts);
    }

    /// @notice Revoke an existing credential (e.g., issued in error or later invalidated).
    /// @dev Issuer can revoke only credentials they issued; admin can revoke any.
    function revokeCertificate(bytes32 credentialHash) external whenNotPaused {
        Credential storage c = _credentials[credentialHash];
        if (c.issuedAt == 0) revert CredentialNotFound(credentialHash);
        if (c.revoked) return;

        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
        if (!isAdmin) {
            // Only the original issuer may revoke their issued credential.
            if (c.issuer != msg.sender) revert NotCredentialIssuer(msg.sender, c.issuer);
        }

        c.revoked = true;
        emit CredentialRevoked(credentialHash, msg.sender, uint64(block.timestamp));
    }

    /// @notice Verify a credential hash exists and is not revoked.
    /// @return valid True if issued and not revoked.
    function verifyCertificate(bytes32 credentialHash) external view returns (bool valid) {
        Credential storage c = _credentials[credentialHash];
        return (c.issuedAt != 0 && !c.revoked);
    }

    /// @notice Fetch full on-chain record for a credential hash.
    function getCertificate(bytes32 credentialHash)
        external
        view
        returns (address issuer, address learner, uint64 issuedAt, bool revoked, string memory uri)
    {
        Credential storage c = _credentials[credentialHash];
        if (c.issuedAt == 0) revert CredentialNotFound(credentialHash);
        return (c.issuer, c.learner, c.issuedAt, c.revoked, c.uri);
    }
}


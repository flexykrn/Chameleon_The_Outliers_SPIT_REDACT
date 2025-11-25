// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LogAnchor {
    struct AnchoredBatch {
        bytes32 merkleRoot;
        uint256 timestamp;
        address committer;
    }

    mapping(string => AnchoredBatch) public batches;

    event LogBatchAnchored(
        string indexed batchId,
        bytes32 merkleRoot,
        uint256 timestamp,
        address indexed committer
    );

    function anchorRoot(string calldata batchId, bytes32 merkleRoot) external {
        require(batches[batchId].timestamp == 0, "Batch already anchored");
        
        batches[batchId] = AnchoredBatch({
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            committer: msg.sender
        });

        emit LogBatchAnchored(batchId, merkleRoot, block.timestamp, msg.sender);
    }

    function verifyBatch(string calldata batchId) external view returns (
        bytes32 merkleRoot,
        uint256 timestamp,
        address committer
    ) {
        AnchoredBatch memory batch = batches[batchId];
        require(batch.timestamp != 0, "Batch not found");
        return (batch.merkleRoot, batch.timestamp, batch.committer);
    }
}

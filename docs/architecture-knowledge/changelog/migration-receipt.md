---
record_type: changelog_migration_receipt
receipt_version: 1
migration_id: qhcm-0d59be61a1db421c5c8f13f1c3005839
source_package_type: chronicle-quality-hub-changelog-migration
source_package_version: 1
source_package_sha256: 35a6e39402144850dd31fe1959717784273dd8ea91d7668291e947c325d993e5
source_revision: d9a3fa6adfd84ab896289e03d82283f676a1695e
source_fingerprint: e67bab95d7f1eb5f9ef0d9e94975ee5038afb608fbac605b0ded9ba4adcf3f89
source_authority: authenticated-owner-and-matching-local-storage-post-incident-union
source_authority_ref: CG-LOG-022
source_authority_approved_on: 2026-08-01
imported_on: 2026-08-04
provenance_limit: post_incident_union_original_170_membership_unknown
source_counts:
  ownerDb: 203
  localStorage: 203
  repositorySeed: 203
source_changelog_hashes:
  ownerDb: d5333d9c6c862e10baea39a5be62a370b77f80f181015b5d6361457748ecf3cb
  localStorage: d5333d9c6c862e10baea39a5be62a370b77f80f181015b5d6361457748ecf3cb
  repositorySeed: 28508a2160980018c9042abe3b162591099465ba12f83053761b55904cde71bf
selected_legacy_ids_sha256: 5f7bbd51922b9ab7b171892d2c2b6f9164544235a8163d232479c3fe4d37bc37
global_legacy_count: 203
community_gallery_count: 22
non_gallery_count: 180
pending_gallery_count: 1
identical_across_sources_count: 47
normalized_optional_difference_count: 151
reviewed_reference_difference_count: 2
reviewed_substantive_collision_count: 3
import_status: imported
entries:
  - legacy_source_id: cl-20260327-001
    canonical_change_id: LEGACY-QH-cl-20260327-001
    owner_db_hash: 3f7bb1c705fa0dd3b5ea85949516686b7554492a3f1db7375cb1b9c55a124482
    local_storage_hash: 3f7bb1c705fa0dd3b5ea85949516686b7554492a3f1db7375cb1b9c55a124482
    repository_seed_hash: 2e2b8bd26c0ed1b2e71e5716eb079fcd4592d189a8b48396f7771461bcf91b0f
    selected_hash: 3f7bb1c705fa0dd3b5ea85949516686b7554492a3f1db7375cb1b9c55a124482
    preserved_record_hash: 3f7bb1c705fa0dd3b5ea85949516686b7554492a3f1db7375cb1b9c55a124482
    generated_markdown_sha256: 92230e838d4f417943cb8620fadcf85d26dc9a804184362c733de5efc03d48a4
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record repairs ShareStoryModal startup, which owns the Publish, Allow Edits, and Unpublish commands that create or remove Community Gallery publications.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-002
    canonical_change_id: LEGACY-QH-cl-20260327-002
    owner_db_hash: d27be7fe2bd90a13fe5a73095795510070136cadf1b9b22680f69c80218bf8cc
    local_storage_hash: d27be7fe2bd90a13fe5a73095795510070136cadf1b9b22680f69c80218bf8cc
    repository_seed_hash: 4053939c32ac9865d45ce4af6ff9c79ad059e1f94ee37cb907117ca4fc1a4326
    selected_hash: d27be7fe2bd90a13fe5a73095795510070136cadf1b9b22680f69c80218bf8cc
    preserved_record_hash: d27be7fe2bd90a13fe5a73095795510070136cadf1b9b22680f69c80218bf8cc
    generated_markdown_sha256: d5e13f62853ab84a4c46cc536f7812f9c83fb4f6fb8c6dac8fec7642158a1f79
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-003
    canonical_change_id: LEGACY-QH-cl-20260327-003
    owner_db_hash: 8be2e5c571dfd77fe087744690835f05ccdf27ae14cbaa3dac517f92d496970b
    local_storage_hash: 8be2e5c571dfd77fe087744690835f05ccdf27ae14cbaa3dac517f92d496970b
    repository_seed_hash: 8507062694f1a6209c48a190b5b38b42706060ab7a968bd213de717ad3bb81a9
    selected_hash: 8be2e5c571dfd77fe087744690835f05ccdf27ae14cbaa3dac517f92d496970b
    preserved_record_hash: 8be2e5c571dfd77fe087744690835f05ccdf27ae14cbaa3dac517f92d496970b
    generated_markdown_sha256: d0aee2dd259a4358feed6c85f616da98f3a9c28ad54c0b4dc36c79cb8a8c8297
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-004
    canonical_change_id: LEGACY-QH-cl-20260327-004
    owner_db_hash: 85ed6a044ab8a49d8d50462d369d8e2fd4baa6f4a3e52db9264236be17a2f0f7
    local_storage_hash: 85ed6a044ab8a49d8d50462d369d8e2fd4baa6f4a3e52db9264236be17a2f0f7
    repository_seed_hash: ae093e6c3a65ec897127101e45c3bd2c14244147801d64fcd37d8101d122fb2a
    selected_hash: 85ed6a044ab8a49d8d50462d369d8e2fd4baa6f4a3e52db9264236be17a2f0f7
    preserved_record_hash: 85ed6a044ab8a49d8d50462d369d8e2fd4baa6f4a3e52db9264236be17a2f0f7
    generated_markdown_sha256: ac9b4a90ae56057ef6e1dd0bb5f95dc2d68f3cfd433edb9235e4320da3683a0a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-005
    canonical_change_id: LEGACY-QH-cl-20260327-005
    owner_db_hash: de22ecf718df069fc46be55fd9152d2f7d5d717c1a697a8cce5e0536acb320fb
    local_storage_hash: de22ecf718df069fc46be55fd9152d2f7d5d717c1a697a8cce5e0536acb320fb
    repository_seed_hash: b72b1a2926fe355aef988eb2eea5dbd48a5f19ba404a3c3e8b4ee424fd5bfbff
    selected_hash: de22ecf718df069fc46be55fd9152d2f7d5d717c1a697a8cce5e0536acb320fb
    preserved_record_hash: de22ecf718df069fc46be55fd9152d2f7d5d717c1a697a8cce5e0536acb320fb
    generated_markdown_sha256: ee02e5a265a832049684dacf92d0128d7af37ff9ed0495356e785feb8c7dff55
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-006
    canonical_change_id: LEGACY-QH-cl-20260327-006
    owner_db_hash: d5a61c75d75aaed3c521662a4c3a6495d46d7312e92bc30b9f6d7b3b6f1896fd
    local_storage_hash: d5a61c75d75aaed3c521662a4c3a6495d46d7312e92bc30b9f6d7b3b6f1896fd
    repository_seed_hash: 29d8f0f5401106e20bee1e2df26ed265cf4d94d0e6c9267e9f0e3faef39894ae
    selected_hash: d5a61c75d75aaed3c521662a4c3a6495d46d7312e92bc30b9f6d7b3b6f1896fd
    preserved_record_hash: d5a61c75d75aaed3c521662a4c3a6495d46d7312e92bc30b9f6d7b3b6f1896fd
    generated_markdown_sha256: d822ce7e124e6feff3f1d5da90375a03eb1a26b0d2f35451ae1838365466d831
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes the initial and incremental loading presentation used by Community Gallery.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-007
    canonical_change_id: LEGACY-QH-cl-20260327-007
    owner_db_hash: 15c51ca2440bb31f7ad150d8ec401f3e262f03ba0dafa77b910421e0347f6375
    local_storage_hash: 15c51ca2440bb31f7ad150d8ec401f3e262f03ba0dafa77b910421e0347f6375
    repository_seed_hash: 89dddd590c7d5df4820cad5046ca388410ca29cd071466635d17456dace05fff
    selected_hash: 15c51ca2440bb31f7ad150d8ec401f3e262f03ba0dafa77b910421e0347f6375
    preserved_record_hash: 15c51ca2440bb31f7ad150d8ec401f3e262f03ba0dafa77b910421e0347f6375
    generated_markdown_sha256: c45876c9e33391f89567e25970b016d565c3f2341dc126d9004faf74e18ca703
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-008
    canonical_change_id: LEGACY-QH-cl-20260327-008
    owner_db_hash: 032dc0d3877244274bd5000759fd548db387c87e2c9a85f3f4bc4f53b633d677
    local_storage_hash: 032dc0d3877244274bd5000759fd548db387c87e2c9a85f3f4bc4f53b633d677
    repository_seed_hash: 90cd86bf71ba4e9e65847951c08993c8f5b71a3ad559d01095da46dd06d92f78
    selected_hash: 032dc0d3877244274bd5000759fd548db387c87e2c9a85f3f4bc4f53b633d677
    preserved_record_hash: 032dc0d3877244274bd5000759fd548db387c87e2c9a85f3f4bc4f53b633d677
    generated_markdown_sha256: 3ae0938ed3ac548a1a55d062dd360bd50dae861e66a7b98bf6a7701fc5a13684
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-009
    canonical_change_id: LEGACY-QH-cl-20260327-009
    owner_db_hash: fa36a649ad91a8656838c17c4f8637d0f40cdbdfe951928e41bad5e139456af7
    local_storage_hash: fa36a649ad91a8656838c17c4f8637d0f40cdbdfe951928e41bad5e139456af7
    repository_seed_hash: 0fc2ad140b2d898cf9b91910340850f6c9ef429232bfb416dbc96ace89458387
    selected_hash: fa36a649ad91a8656838c17c4f8637d0f40cdbdfe951928e41bad5e139456af7
    preserved_record_hash: fa36a649ad91a8656838c17c4f8637d0f40cdbdfe951928e41bad5e139456af7
    generated_markdown_sha256: b160cc338b1cf5ac6c13f8d87a8b0a52643a540d871fd6cd6f80f40015643023
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-010
    canonical_change_id: LEGACY-QH-cl-20260327-010
    owner_db_hash: be6400fd2db3bf940af56fcdb5657b817ab4fe74e9977ebde17f47d69f5a1773
    local_storage_hash: be6400fd2db3bf940af56fcdb5657b817ab4fe74e9977ebde17f47d69f5a1773
    repository_seed_hash: ef770e6931dc62d2c7e3bb5b99f6fcfd7f1dcffc78ecb46417977d15b5d8c9f0
    selected_hash: be6400fd2db3bf940af56fcdb5657b817ab4fe74e9977ebde17f47d69f5a1773
    preserved_record_hash: be6400fd2db3bf940af56fcdb5657b817ab4fe74e9977ebde17f47d69f5a1773
    generated_markdown_sha256: 3e2a340b93354d67ebe52be33e1932a3d61ee63853fa154fc30a205d70ba43a0
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-011
    canonical_change_id: LEGACY-QH-cl-20260327-011
    owner_db_hash: fd6d2e8f83d85df6171cee7b7f08d5f1c3f04fd0909ca8fcffe34f507d18226c
    local_storage_hash: fd6d2e8f83d85df6171cee7b7f08d5f1c3f04fd0909ca8fcffe34f507d18226c
    repository_seed_hash: 9b47faf49ec5ac4a8669ad32355277b7afc9e5a89c5cabe90e0baf7ffe0af5b9
    selected_hash: fd6d2e8f83d85df6171cee7b7f08d5f1c3f04fd0909ca8fcffe34f507d18226c
    preserved_record_hash: fd6d2e8f83d85df6171cee7b7f08d5f1c3f04fd0909ca8fcffe34f507d18226c
    generated_markdown_sha256: 2c94b018ced8bf3ccccecfb122bba537da79e009d4d39c25cd875054163f647c
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-012
    canonical_change_id: LEGACY-QH-cl-20260327-012
    owner_db_hash: d41ad71aad9a9fe7fed90fa3ba45c78aa4768acc699d127bb989fb53866eb647
    local_storage_hash: d41ad71aad9a9fe7fed90fa3ba45c78aa4768acc699d127bb989fb53866eb647
    repository_seed_hash: dcedc1a4fe44b27bdb708c2c1ebe8547ff59cd03788ce239538903c5657f2aea
    selected_hash: d41ad71aad9a9fe7fed90fa3ba45c78aa4768acc699d127bb989fb53866eb647
    preserved_record_hash: d41ad71aad9a9fe7fed90fa3ba45c78aa4768acc699d127bb989fb53866eb647
    generated_markdown_sha256: 2eff9ce0016d63b7b0686bd6aec0c6967fcf5d5cb4dec52e4d5550ad96c4ff5c
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-013
    canonical_change_id: LEGACY-QH-cl-20260327-013
    owner_db_hash: 3f57184e9e7a17708eb1b9c9d69ef8a619d66128c7af90f8659b2d93d597ee87
    local_storage_hash: 3f57184e9e7a17708eb1b9c9d69ef8a619d66128c7af90f8659b2d93d597ee87
    repository_seed_hash: 8f652e828b84b275681687c55ffb2537760eb3e601d7548063d2bb9ae631f892
    selected_hash: 3f57184e9e7a17708eb1b9c9d69ef8a619d66128c7af90f8659b2d93d597ee87
    preserved_record_hash: 3f57184e9e7a17708eb1b9c9d69ef8a619d66128c7af90f8659b2d93d597ee87
    generated_markdown_sha256: d3f8d661292948afdbd627827a0a8dcb5b9c92e02ff50cdb577a6c128e4ad782
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-014
    canonical_change_id: LEGACY-QH-cl-20260327-014
    owner_db_hash: a4c4b7f9c2921b9e8d4499d5aa86f81b7900e14276a9646550f2b471ad5c11c9
    local_storage_hash: a4c4b7f9c2921b9e8d4499d5aa86f81b7900e14276a9646550f2b471ad5c11c9
    repository_seed_hash: 31451e0eb0a72f1d94eaa646cd2c3c6b7608571f3ec78ce38c30e2e6f472361f
    selected_hash: a4c4b7f9c2921b9e8d4499d5aa86f81b7900e14276a9646550f2b471ad5c11c9
    preserved_record_hash: a4c4b7f9c2921b9e8d4499d5aa86f81b7900e14276a9646550f2b471ad5c11c9
    generated_markdown_sha256: 4f73c26439949a5aaa61d5a72b21b332e9a82c2c1d5d363680119de3bba6fb54
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-015
    canonical_change_id: LEGACY-QH-cl-20260327-015
    owner_db_hash: d8a96637fd729a162ff285564a35ca406ae6b5ae76ffcab3bd09dcd22d2d1d08
    local_storage_hash: d8a96637fd729a162ff285564a35ca406ae6b5ae76ffcab3bd09dcd22d2d1d08
    repository_seed_hash: 22fe95c6f2bc8faaa9ccb10b5afe700e7f465c63dddacc5d8778936ae487d76d
    selected_hash: d8a96637fd729a162ff285564a35ca406ae6b5ae76ffcab3bd09dcd22d2d1d08
    preserved_record_hash: d8a96637fd729a162ff285564a35ca406ae6b5ae76ffcab3bd09dcd22d2d1d08
    generated_markdown_sha256: 9dde063d1aba6f9b6a3f6719d45179058ba7f5bb7ad822740104c9dbe2c27a33
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-016
    canonical_change_id: LEGACY-QH-cl-20260327-016
    owner_db_hash: 95e95011ca2055f008a920d0c5b712a16f17dd0427382f6280d38c56c6a87e14
    local_storage_hash: 95e95011ca2055f008a920d0c5b712a16f17dd0427382f6280d38c56c6a87e14
    repository_seed_hash: c008fb40002b3ded85f2e2b5c5907da02bab19d4d28f55ec6d560bae0eedff24
    selected_hash: 95e95011ca2055f008a920d0c5b712a16f17dd0427382f6280d38c56c6a87e14
    preserved_record_hash: 95e95011ca2055f008a920d0c5b712a16f17dd0427382f6280d38c56c6a87e14
    generated_markdown_sha256: 4f1a3414013938f3891b67b812f369afd0f9788a3dfc8b251355e23bdd12bbab
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-017
    canonical_change_id: LEGACY-QH-cl-20260327-017
    owner_db_hash: 686c45e2c54c776d3f75860a039a44bb6b1cbbed888a59010d5471308b4f0208
    local_storage_hash: 686c45e2c54c776d3f75860a039a44bb6b1cbbed888a59010d5471308b4f0208
    repository_seed_hash: 59047efd6f2d1b2fdfa74a6d8f53b3acba2b34562f1fc72f41bd1c309dca383f
    selected_hash: 686c45e2c54c776d3f75860a039a44bb6b1cbbed888a59010d5471308b4f0208
    preserved_record_hash: 686c45e2c54c776d3f75860a039a44bb6b1cbbed888a59010d5471308b4f0208
    generated_markdown_sha256: 0f984c27f58d4f8a332cc918b9eba48a425c1dcb15f58b2a05e57f21c14117b0
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260327-018
    canonical_change_id: LEGACY-QH-cl-20260327-018
    owner_db_hash: 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4
    local_storage_hash: 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4
    repository_seed_hash: 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4
    selected_hash: 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4
    preserved_record_hash: 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4
    generated_markdown_sha256: 63910caf32c627cf300d00c15c2c096f158efe2db6ba63f8644cf6cb54383c7c
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-001
    canonical_change_id: LEGACY-QH-cl-20260328-001
    owner_db_hash: 758f13887d73cab028e7adc932b32d3ad2658dd80a60e55793e2b8e523866b23
    local_storage_hash: 758f13887d73cab028e7adc932b32d3ad2658dd80a60e55793e2b8e523866b23
    repository_seed_hash: a279b8375df9442ab69cee4cfc75dc6dd300b8ecffc78fdf34f8e8133b84bf3a
    selected_hash: 758f13887d73cab028e7adc932b32d3ad2658dd80a60e55793e2b8e523866b23
    preserved_record_hash: 758f13887d73cab028e7adc932b32d3ad2658dd80a60e55793e2b8e523866b23
    generated_markdown_sha256: 7391f26887b93d6462d15e7474c3e2483350b57446880b5bcae30ad89b1f190a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-002
    canonical_change_id: LEGACY-QH-cl-20260328-002
    owner_db_hash: 44f6ef81ed6f74645f799f227b7c5d6e704e8589f5107b49e0b93ad7c953ac53
    local_storage_hash: 44f6ef81ed6f74645f799f227b7c5d6e704e8589f5107b49e0b93ad7c953ac53
    repository_seed_hash: 5bd46aee24d3ac0e2df9b632e53f9c4102431ab60a02debf6a6a7804729145d4
    selected_hash: 44f6ef81ed6f74645f799f227b7c5d6e704e8589f5107b49e0b93ad7c953ac53
    preserved_record_hash: 44f6ef81ed6f74645f799f227b7c5d6e704e8589f5107b49e0b93ad7c953ac53
    generated_markdown_sha256: 11af24e7bd26d96e9450fcd570dcb7bc215d6a3bb7999b2fb2963bfcd4ed0f7a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-003
    canonical_change_id: LEGACY-QH-cl-20260328-003
    owner_db_hash: 41f888ec28a101cc7e976188cd2e8cf6a46ef1964f05d37395eeb0c333bb4c22
    local_storage_hash: 41f888ec28a101cc7e976188cd2e8cf6a46ef1964f05d37395eeb0c333bb4c22
    repository_seed_hash: 009bae30ba5793a9482acede49da2641f8f7e323ca301335d53e27d6714b9441
    selected_hash: 41f888ec28a101cc7e976188cd2e8cf6a46ef1964f05d37395eeb0c333bb4c22
    preserved_record_hash: 41f888ec28a101cc7e976188cd2e8cf6a46ef1964f05d37395eeb0c333bb4c22
    generated_markdown_sha256: a808f9ca85126e57319adf90ca98d23db65fc5875d91096dc73d397e736ad4e3
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-004
    canonical_change_id: LEGACY-QH-cl-20260328-004
    owner_db_hash: c133e075808b109a171035179ba90a535c5df9cd685a914670ed727e4052fc3d
    local_storage_hash: c133e075808b109a171035179ba90a535c5df9cd685a914670ed727e4052fc3d
    repository_seed_hash: 283805cd3a6d7020a0aaaefed02549ce673bde20b8a1f6e9ff28e7de3a1d2355
    selected_hash: c133e075808b109a171035179ba90a535c5df9cd685a914670ed727e4052fc3d
    preserved_record_hash: c133e075808b109a171035179ba90a535c5df9cd685a914670ed727e4052fc3d
    generated_markdown_sha256: b32e11759c0dc2687cc336d577feef5c06515d4ad86436572751c3ca5f36721b
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-005
    canonical_change_id: LEGACY-QH-cl-20260328-005
    owner_db_hash: 05cc164852dfc3345a110679f820b71083dcb80f029abe7e1aaaf2d20f58fbe0
    local_storage_hash: 05cc164852dfc3345a110679f820b71083dcb80f029abe7e1aaaf2d20f58fbe0
    repository_seed_hash: e2198ec25bb726781cfd92194960a82d1fa76808e2993cbea88b6783a221e412
    selected_hash: 05cc164852dfc3345a110679f820b71083dcb80f029abe7e1aaaf2d20f58fbe0
    preserved_record_hash: 05cc164852dfc3345a110679f820b71083dcb80f029abe7e1aaaf2d20f58fbe0
    generated_markdown_sha256: b9c8731475a199aae95fc5da5d8f4ee012d849073b7fb892c1babc8ea4ea1be9
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-006
    canonical_change_id: LEGACY-QH-cl-20260328-006
    owner_db_hash: d2dc90dd6051c873665112106f315486148bd18dbd4b1b2c44232b982512a09d
    local_storage_hash: d2dc90dd6051c873665112106f315486148bd18dbd4b1b2c44232b982512a09d
    repository_seed_hash: 663ad2c070ad07f6d37b25e376646d035cb45a2197ef9c4c673006adf6cdb1d9
    selected_hash: d2dc90dd6051c873665112106f315486148bd18dbd4b1b2c44232b982512a09d
    preserved_record_hash: d2dc90dd6051c873665112106f315486148bd18dbd4b1b2c44232b982512a09d
    generated_markdown_sha256: 7245c2bf7c7b2bdbd768b25a67ef1cf129e336dc53408f0b3462f4143e8d1bab
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-007
    canonical_change_id: LEGACY-QH-cl-20260328-007
    owner_db_hash: 4118e8a69a8e242e8bb7d9ae442f08178e0d92b5ebc41cdc3aef9d529456e554
    local_storage_hash: 4118e8a69a8e242e8bb7d9ae442f08178e0d92b5ebc41cdc3aef9d529456e554
    repository_seed_hash: e1ad0870e986f841ad5c3b1f4475139e9130dbf07e714b248af51c1985342d58
    selected_hash: 4118e8a69a8e242e8bb7d9ae442f08178e0d92b5ebc41cdc3aef9d529456e554
    preserved_record_hash: 4118e8a69a8e242e8bb7d9ae442f08178e0d92b5ebc41cdc3aef9d529456e554
    generated_markdown_sha256: 4058aacc22a2d769731ab532b964ae34a38a64ab92b693735df6d17c9fc5ddbb
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-008
    canonical_change_id: LEGACY-QH-cl-20260328-008
    owner_db_hash: e7f7636aebba6f67450e864c922746dd35ea9f0b1c4f4c997ab12a690756cb9f
    local_storage_hash: e7f7636aebba6f67450e864c922746dd35ea9f0b1c4f4c997ab12a690756cb9f
    repository_seed_hash: d9d02cee9757fc9b5100e013f3bd310530646997b849cceec2c698cec6c1a478
    selected_hash: e7f7636aebba6f67450e864c922746dd35ea9f0b1c4f4c997ab12a690756cb9f
    preserved_record_hash: e7f7636aebba6f67450e864c922746dd35ea9f0b1c4f4c997ab12a690756cb9f
    generated_markdown_sha256: 45b570306c4d7243bb844bc57d823b1ef04658747bf316ece7ab0f765a7448fd
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260328-009
    canonical_change_id: LEGACY-QH-cl-20260328-009
    owner_db_hash: c174829aea710bbfc4c9f9998064362139a86e8887662ae132453ea6a7668165
    local_storage_hash: c174829aea710bbfc4c9f9998064362139a86e8887662ae132453ea6a7668165
    repository_seed_hash: 3adc3d4c87dc8f0281838d8988fff1bde82dfd97f952851ca7a2b42d80edd8fa
    selected_hash: c174829aea710bbfc4c9f9998064362139a86e8887662ae132453ea6a7668165
    preserved_record_hash: c174829aea710bbfc4c9f9998064362139a86e8887662ae132453ea6a7668165
    generated_markdown_sha256: 63d81cbb90f0943e09b179d1e7110caf99f6c1b1308ccf3dafa31bf004f1e0ce
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260330-001
    canonical_change_id: LEGACY-QH-cl-20260330-001
    owner_db_hash: 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa
    local_storage_hash: 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa
    repository_seed_hash: 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa
    selected_hash: 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa
    preserved_record_hash: 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa
    generated_markdown_sha256: 6ec7f2cdb9705293d15b5600b55551f59c3b5ba47ba8e275c1c86777e0183002
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes GalleryStoryCard ref behavior as part of a cross-surface runtime-stability pass.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260330-002
    canonical_change_id: LEGACY-QH-cl-20260330-002
    owner_db_hash: 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f
    local_storage_hash: 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f
    repository_seed_hash: 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f
    selected_hash: 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f
    preserved_record_hash: 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f
    generated_markdown_sha256: 3404394ae108ee3ee71871411455d4a8f944b04d141d1ee937fa9ba50dbb41a1
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260330-003
    canonical_change_id: LEGACY-QH-cl-20260330-003
    owner_db_hash: b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2
    local_storage_hash: b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2
    repository_seed_hash: b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2
    selected_hash: b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2
    preserved_record_hash: b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2
    generated_markdown_sha256: cbcf03059ec401c020eb2e5b219d9276531c1847df1a75e40e39b1f4cbbe9cc7
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260330-004
    canonical_change_id: LEGACY-QH-cl-20260330-004
    owner_db_hash: daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf
    local_storage_hash: daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf
    repository_seed_hash: daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf
    selected_hash: daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf
    preserved_record_hash: daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf
    generated_markdown_sha256: 65e64288ab36c91afa84c42f74a2c8b2ee94b00ab8b7a29231009a6706e54a37
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260331-001
    canonical_change_id: LEGACY-QH-cl-20260331-001
    owner_db_hash: 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59
    local_storage_hash: 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59
    repository_seed_hash: 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59
    selected_hash: 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59
    preserved_record_hash: 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59
    generated_markdown_sha256: 89ed354f78078643ea6414af513f51f03ad794cc834a686b25606f0c8ce30265
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260331-002
    canonical_change_id: LEGACY-QH-cl-20260331-002
    owner_db_hash: 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78
    local_storage_hash: 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78
    repository_seed_hash: 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78
    selected_hash: 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78
    preserved_record_hash: 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78
    generated_markdown_sha256: bfdfe633e0d0fe051d4a1076eb3f06e3528f6096461d4ecd116bb68bdd8d2762
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260331-003
    canonical_change_id: LEGACY-QH-cl-20260331-003
    owner_db_hash: 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5
    local_storage_hash: 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5
    repository_seed_hash: 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5
    selected_hash: 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5
    preserved_record_hash: 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5
    generated_markdown_sha256: ac3c2faffaf885800f1bb304d446b71442e6b548498e7c336d4c77e11d6e26f7
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260331-004
    canonical_change_id: LEGACY-QH-cl-20260331-004
    owner_db_hash: 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be
    local_storage_hash: 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be
    repository_seed_hash: 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be
    selected_hash: 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be
    preserved_record_hash: 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be
    generated_markdown_sha256: c48c954098f900b8ad710700c53a19356aca424cfd33e8a5aee9b83c68ada52f
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260331-005
    canonical_change_id: LEGACY-QH-cl-20260331-005
    owner_db_hash: 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37
    local_storage_hash: 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37
    repository_seed_hash: 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37
    selected_hash: 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37
    preserved_record_hash: 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37
    generated_markdown_sha256: 04431d9e86b4534d918e6c95e54c091d258fbdd04c910ceeddb008c1f02162b6
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: pending_excluded
    affected_capabilities: []
    rationale: The record mentions Community Gallery guide maintenance inside a broader tooling-integrity sweep, but the approved review found no stronger evidence of a Community Gallery product or runtime change. It remains globally preserved and excluded from the Gallery projection pending stronger evidence.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260331-006
    canonical_change_id: LEGACY-QH-cl-20260331-006
    owner_db_hash: 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288
    local_storage_hash: 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288
    repository_seed_hash: 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288
    selected_hash: 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288
    preserved_record_hash: 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288
    generated_markdown_sha256: 6eecb3efa474ce54605414d4e48ad8581a3a9adb51103648cd6dbfb1984149a2
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260331-007
    canonical_change_id: LEGACY-QH-cl-20260331-007
    owner_db_hash: 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907
    local_storage_hash: 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907
    repository_seed_hash: 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907
    selected_hash: 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907
    preserved_record_hash: 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907
    generated_markdown_sha256: 02dd1fedc9588cc3803e5a269ef88212a48b03a091d1142cbba1f25481ed8891
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260331-008
    canonical_change_id: LEGACY-QH-cl-20260331-008
    owner_db_hash: 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0
    local_storage_hash: 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0
    repository_seed_hash: 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0
    selected_hash: 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0
    preserved_record_hash: 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0
    generated_markdown_sha256: 0aceff2321f489e5d6c535ca17599af564969ae4acf3cf284548bfc8cadd0283
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260401-001
    canonical_change_id: LEGACY-QH-cl-20260401-001
    owner_db_hash: ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8
    local_storage_hash: ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8
    repository_seed_hash: ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8
    selected_hash: ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8
    preserved_record_hash: ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8
    generated_markdown_sha256: b146a7b4ae88a7ca92aa91c52db62973cddb8bb40021971bb51ae55c70650738
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260401-002
    canonical_change_id: LEGACY-QH-cl-20260401-002
    owner_db_hash: 692285da7ab6b3eb7e73c1decf1854eb50dc778277d588f9917d25ab6cf36bf5
    local_storage_hash: 692285da7ab6b3eb7e73c1decf1854eb50dc778277d588f9917d25ab6cf36bf5
    repository_seed_hash: 59a39061b3e63a6f4229e980ffd95eadab35d5ac49101db2189039afc24ca11b
    selected_hash: 692285da7ab6b3eb7e73c1decf1854eb50dc778277d588f9917d25ab6cf36bf5
    preserved_record_hash: 692285da7ab6b3eb7e73c1decf1854eb50dc778277d588f9917d25ab6cf36bf5
    generated_markdown_sha256: fadbe386b120c92633258897a5d878cceb500424ddbbfaf0b1f54e4800b0b1f6
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260401-003
    canonical_change_id: LEGACY-QH-cl-20260401-003
    owner_db_hash: def78c5f961a809b55cfd4875f247b96f03e5b7d9b72cd2ab413618c60e67da9
    local_storage_hash: def78c5f961a809b55cfd4875f247b96f03e5b7d9b72cd2ab413618c60e67da9
    repository_seed_hash: bec081af3430db5d3b8375b91e7a5f7c8cce477c1aacca8f461411f592233158
    selected_hash: def78c5f961a809b55cfd4875f247b96f03e5b7d9b72cd2ab413618c60e67da9
    preserved_record_hash: def78c5f961a809b55cfd4875f247b96f03e5b7d9b72cd2ab413618c60e67da9
    generated_markdown_sha256: 0093547ca93d7a24ca1c1d31e8eb4e3706ccf48ab11f072319082ad97b027898
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260401-004
    canonical_change_id: LEGACY-QH-cl-20260401-004
    owner_db_hash: ec05ae331fc21c339237c65ff4f776f5173a67457734a7a392c7403d06ebc71d
    local_storage_hash: ec05ae331fc21c339237c65ff4f776f5173a67457734a7a392c7403d06ebc71d
    repository_seed_hash: 0dae1dac6039c72b5127354cff5bd1026d89d4d5dc8fbc178d49ba917047f033
    selected_hash: ec05ae331fc21c339237c65ff4f776f5173a67457734a7a392c7403d06ebc71d
    preserved_record_hash: ec05ae331fc21c339237c65ff4f776f5173a67457734a7a392c7403d06ebc71d
    generated_markdown_sha256: 015188190a6b0f70be4d888ec692f54d12e9611a2f689e1f049a82270cf378d5
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260401-005
    canonical_change_id: LEGACY-QH-cl-20260401-005
    owner_db_hash: aa0af56d75beb9e688a66ffbf4a86d4d39c677e10b9cca6919485a64b49d59e8
    local_storage_hash: aa0af56d75beb9e688a66ffbf4a86d4d39c677e10b9cca6919485a64b49d59e8
    repository_seed_hash: fbb159aaf420d102e61ed8dfbf706e0ae875c6a0accfab2e4e4dc3c746038c74
    selected_hash: aa0af56d75beb9e688a66ffbf4a86d4d39c677e10b9cca6919485a64b49d59e8
    preserved_record_hash: aa0af56d75beb9e688a66ffbf4a86d4d39c677e10b9cca6919485a64b49d59e8
    generated_markdown_sha256: a412e84f2e38bce03dd4cfa14cbb761810c789b56b4f6945dbf61fc9b0fb6bd5
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260402-001
    canonical_change_id: LEGACY-QH-cl-20260402-001
    owner_db_hash: b59f65f298db22cf285731cc848b54ec43db136eb0eac5a36c8e325e24226228
    local_storage_hash: b59f65f298db22cf285731cc848b54ec43db136eb0eac5a36c8e325e24226228
    repository_seed_hash: f031fa2159e1cd60f2888265e65d3bec24d9a156c5ea9fd4b6628b1b183d2f2a
    selected_hash: b59f65f298db22cf285731cc848b54ec43db136eb0eac5a36c8e325e24226228
    preserved_record_hash: b59f65f298db22cf285731cc848b54ec43db136eb0eac5a36c8e325e24226228
    generated_markdown_sha256: 41de6b5187f629815c17249616f0dca1e97b2b9728218950966d731533dfc6ba
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260402-002
    canonical_change_id: LEGACY-QH-cl-20260402-002
    owner_db_hash: 884438ec01afb4a9e871b9c5f92000af69abb75ca1d0de0ef4cd124e71a8a7b7
    local_storage_hash: 884438ec01afb4a9e871b9c5f92000af69abb75ca1d0de0ef4cd124e71a8a7b7
    repository_seed_hash: 768a2bd2bb91244d9d7070765092d6f22a612e68d32dce35f6f4e235c769d199
    selected_hash: 884438ec01afb4a9e871b9c5f92000af69abb75ca1d0de0ef4cd124e71a8a7b7
    preserved_record_hash: 884438ec01afb4a9e871b9c5f92000af69abb75ca1d0de0ef4cd124e71a8a7b7
    generated_markdown_sha256: e1492e2cb1e134e1c61efc3f8b95ba6815a511f080c98ae2ec3505932e883831
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-001
    canonical_change_id: LEGACY-QH-cl-20260404-001
    owner_db_hash: 1213c31c3b664427e88ad696235e8ce7afafc95258e2936487cd9ddf1d85b88a
    local_storage_hash: 1213c31c3b664427e88ad696235e8ce7afafc95258e2936487cd9ddf1d85b88a
    repository_seed_hash: a09bcaad8344a88c74bc30a48a9503e631d53e6a0b4303d2bb9b1a703f541e3f
    selected_hash: 1213c31c3b664427e88ad696235e8ce7afafc95258e2936487cd9ddf1d85b88a
    preserved_record_hash: 1213c31c3b664427e88ad696235e8ce7afafc95258e2936487cd9ddf1d85b88a
    generated_markdown_sha256: 889789cdd92e29b0bdc7cd8e7e3db7a40607e0c047a3e097b6115794b840744c
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-002
    canonical_change_id: LEGACY-QH-cl-20260404-002
    owner_db_hash: 1c71157a715874b1db94b6f2f34ad460608f00afe15ee56ea74823080c821091
    local_storage_hash: 1c71157a715874b1db94b6f2f34ad460608f00afe15ee56ea74823080c821091
    repository_seed_hash: f9faf54ed91d202b4b204cea4fe26bff7c57035f6c19c6b01cde1055cc595ee5
    selected_hash: 1c71157a715874b1db94b6f2f34ad460608f00afe15ee56ea74823080c821091
    preserved_record_hash: 1c71157a715874b1db94b6f2f34ad460608f00afe15ee56ea74823080c821091
    generated_markdown_sha256: d4e88f643a48986384ab0917c4355eb704bbc3e3f566bda9b4131fce8b1402e8
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-003
    canonical_change_id: LEGACY-QH-cl-20260404-003
    owner_db_hash: a0c31962e16f5de9e05c9f51ad2468a83d4a3cd35972fc22248192d69b8f9430
    local_storage_hash: a0c31962e16f5de9e05c9f51ad2468a83d4a3cd35972fc22248192d69b8f9430
    repository_seed_hash: 8869733a3d95eeb0eb99674d9af9c8ca5297ad2f7bb3272f64a43a436688fb88
    selected_hash: a0c31962e16f5de9e05c9f51ad2468a83d4a3cd35972fc22248192d69b8f9430
    preserved_record_hash: a0c31962e16f5de9e05c9f51ad2468a83d4a3cd35972fc22248192d69b8f9430
    generated_markdown_sha256: d981ca057af589173dff3095bed329868217ac70167e2caccaeb979ecd171065
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-004
    canonical_change_id: LEGACY-QH-cl-20260404-004
    owner_db_hash: a2b4c5f8f6282d9d17bf1456814e1c17b3fd477fa80e0f776832699e2ad3be88
    local_storage_hash: a2b4c5f8f6282d9d17bf1456814e1c17b3fd477fa80e0f776832699e2ad3be88
    repository_seed_hash: 50c25b7ed55df808a80d9826c20c1b3ce7ea7ae02624ffbb8eba5091b2d0267b
    selected_hash: a2b4c5f8f6282d9d17bf1456814e1c17b3fd477fa80e0f776832699e2ad3be88
    preserved_record_hash: a2b4c5f8f6282d9d17bf1456814e1c17b3fd477fa80e0f776832699e2ad3be88
    generated_markdown_sha256: 77bbde549a04653ff488ab6557603d87968a8fc054f2b34d03d1f352f0a081b7
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes Gallery container refs and pre-auth request behavior on the delivered Gallery shell.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-005
    canonical_change_id: LEGACY-QH-cl-20260404-005
    owner_db_hash: c819bae2fe868d1dae3b10d5e6cbb374bf00eb43468a6e867d17f818bc3de24a
    local_storage_hash: c819bae2fe868d1dae3b10d5e6cbb374bf00eb43468a6e867d17f818bc3de24a
    repository_seed_hash: 72ddd72888fd6977a3f03f08e77f7da57111201be36dab1b447a85ccde5d7cfe
    selected_hash: c819bae2fe868d1dae3b10d5e6cbb374bf00eb43468a6e867d17f818bc3de24a
    preserved_record_hash: c819bae2fe868d1dae3b10d5e6cbb374bf00eb43468a6e867d17f818bc3de24a
    generated_markdown_sha256: c1719970a32831df540c4016d11251851eb9d043f61d2826f440833340be778a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-006
    canonical_change_id: LEGACY-QH-cl-20260404-006
    owner_db_hash: b89d381538f5bb3c6e58448e2c0099f5fc43a20acd818abfe84e318ae07490cb
    local_storage_hash: b89d381538f5bb3c6e58448e2c0099f5fc43a20acd818abfe84e318ae07490cb
    repository_seed_hash: 0491265bd5bff731226ada74e89adcc80d588293ee654d1df366724cec31070e
    selected_hash: b89d381538f5bb3c6e58448e2c0099f5fc43a20acd818abfe84e318ae07490cb
    preserved_record_hash: b89d381538f5bb3c6e58448e2c0099f5fc43a20acd818abfe84e318ae07490cb
    generated_markdown_sha256: 75c3d3cf4d1cc8c586407e23ea86e4294a5b5a053dae7f9b8e895e100434f46e
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-007
    canonical_change_id: LEGACY-QH-cl-20260404-007
    owner_db_hash: 947eb73a53a6a0624f99b599475a294035722de62d9926461c088a1090c584d5
    local_storage_hash: 947eb73a53a6a0624f99b599475a294035722de62d9926461c088a1090c584d5
    repository_seed_hash: a6cd82c9bac6840a0cd16b65cd3f7658afead96cf51fdbeec6bc9bc44581f596
    selected_hash: 947eb73a53a6a0624f99b599475a294035722de62d9926461c088a1090c584d5
    preserved_record_hash: 947eb73a53a6a0624f99b599475a294035722de62d9926461c088a1090c584d5
    generated_markdown_sha256: 7f9d5d6cd7767773f24b07f5f2a1017736b79480e47515de33ad9c625f775739
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-008
    canonical_change_id: LEGACY-QH-cl-20260404-008
    owner_db_hash: 1f53716f678d37edd3c2b11fa64252539feaa37e874bd38b0d32c94d5ce801a7
    local_storage_hash: 1f53716f678d37edd3c2b11fa64252539feaa37e874bd38b0d32c94d5ce801a7
    repository_seed_hash: 59773b3848c94278434e78dfb2c8404ff64794741098bb61d5e58d2d3f16d4e0
    selected_hash: 1f53716f678d37edd3c2b11fa64252539feaa37e874bd38b0d32c94d5ce801a7
    preserved_record_hash: 1f53716f678d37edd3c2b11fa64252539feaa37e874bd38b0d32c94d5ce801a7
    generated_markdown_sha256: 822cd2d78bf81dec87ce2ca18d6841af41d6b6eb8502e309b5a8492b9b97184d
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-009
    canonical_change_id: LEGACY-QH-cl-20260404-009
    owner_db_hash: a66692fb594c4a259c140364adca9953aa7230223dd19f9f7fa1acb09a07c4f5
    local_storage_hash: a66692fb594c4a259c140364adca9953aa7230223dd19f9f7fa1acb09a07c4f5
    repository_seed_hash: 1819074e1c25159944badfdbd73e23eb28938482be782e90773cf80d9c93467c
    selected_hash: a66692fb594c4a259c140364adca9953aa7230223dd19f9f7fa1acb09a07c4f5
    preserved_record_hash: a66692fb594c4a259c140364adca9953aa7230223dd19f9f7fa1acb09a07c4f5
    generated_markdown_sha256: 8b017467d73977c41d4002bbce7bbbf058990ebc08d1472992f04fb9ddeca54b
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-010
    canonical_change_id: LEGACY-QH-cl-20260404-010
    owner_db_hash: 0a2d47509c1b4a17db21bd7f8e1ed4916a2ae58ac8b3e934dec2c7dfcf7f24b4
    local_storage_hash: 0a2d47509c1b4a17db21bd7f8e1ed4916a2ae58ac8b3e934dec2c7dfcf7f24b4
    repository_seed_hash: 111b001a0ccb53c7da15efd59caa30d131a0e34c5859a8902cf688b88a7c350c
    selected_hash: 0a2d47509c1b4a17db21bd7f8e1ed4916a2ae58ac8b3e934dec2c7dfcf7f24b4
    preserved_record_hash: 0a2d47509c1b4a17db21bd7f8e1ed4916a2ae58ac8b3e934dec2c7dfcf7f24b4
    generated_markdown_sha256: 4528ace00adb1bfaa8c3b2871829c6bacf5346f0afdc8ea5ec6c1b4a949adb0f
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-011
    canonical_change_id: LEGACY-QH-cl-20260404-011
    owner_db_hash: 49a76b28a647f2eb513dbebadd28ebb8b98f8c4d0d93b45438a82e3eff7109d8
    local_storage_hash: 49a76b28a647f2eb513dbebadd28ebb8b98f8c4d0d93b45438a82e3eff7109d8
    repository_seed_hash: 08ac3765fbe3ae0b7e7f3b2e6485a116eba849c3213c1ae6af3ac7279a00d003
    selected_hash: 49a76b28a647f2eb513dbebadd28ebb8b98f8c4d0d93b45438a82e3eff7109d8
    preserved_record_hash: 49a76b28a647f2eb513dbebadd28ebb8b98f8c4d0d93b45438a82e3eff7109d8
    generated_markdown_sha256: 3bbd676a6fc5949a557f7e7308fb54dab5b44fd7b6439348dd8fc965872a7460
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-012
    canonical_change_id: LEGACY-QH-cl-20260404-012
    owner_db_hash: 0030069e21f1d041bf17dca1ed7957d4e1854838f59487eae80a4d70291d9257
    local_storage_hash: 0030069e21f1d041bf17dca1ed7957d4e1854838f59487eae80a4d70291d9257
    repository_seed_hash: e7215b56a329760d42bfcb8698d68c1747f4cccb5d517500a42d9b4981f76647
    selected_hash: 0030069e21f1d041bf17dca1ed7957d4e1854838f59487eae80a4d70291d9257
    preserved_record_hash: 0030069e21f1d041bf17dca1ed7957d4e1854838f59487eae80a4d70291d9257
    generated_markdown_sha256: 81f993e1413d49c5f48f2ff8dd2b558b8a86738dfd820fd7eb5cc9a8d9b0cb1c
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-013
    canonical_change_id: LEGACY-QH-cl-20260404-013
    owner_db_hash: b93373d2dc03a816646f7bb3eef4bc9ce25b1a36b4639cc5042de7c4c2caf86e
    local_storage_hash: b93373d2dc03a816646f7bb3eef4bc9ce25b1a36b4639cc5042de7c4c2caf86e
    repository_seed_hash: 27debb30f4cc1eb0ebd1393243efe5166f64f229bfb759ed2f929d6fa45b3828
    selected_hash: b93373d2dc03a816646f7bb3eef4bc9ce25b1a36b4639cc5042de7c4c2caf86e
    preserved_record_hash: b93373d2dc03a816646f7bb3eef4bc9ce25b1a36b4639cc5042de7c4c2caf86e
    generated_markdown_sha256: e26e69e371c79d93cd503ccae6c64b4c9867f0b1bcb03128cc27f4683d94177d
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-014
    canonical_change_id: LEGACY-QH-cl-20260404-014
    owner_db_hash: 6cfcffb3fc63fa2735abbae33787d8e19b3ffc8f5217fa12254bde4b43c60bb1
    local_storage_hash: 6cfcffb3fc63fa2735abbae33787d8e19b3ffc8f5217fa12254bde4b43c60bb1
    repository_seed_hash: a60a7b12d0ec6345ab783d8433397a76d83147ea2ddae29ff4e31a280143c242
    selected_hash: 6cfcffb3fc63fa2735abbae33787d8e19b3ffc8f5217fa12254bde4b43c60bb1
    preserved_record_hash: 6cfcffb3fc63fa2735abbae33787d8e19b3ffc8f5217fa12254bde4b43c60bb1
    generated_markdown_sha256: 713e2f339c5d1feac1fcc2ce5c4f3ed27d18ea7f120dededf6659c40307ddd22
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260404-015
    canonical_change_id: LEGACY-QH-cl-20260404-015
    owner_db_hash: 089d47523488b88c6a41cd209b031e4ec817a3b19dd4cdee27f439b301433e8a
    local_storage_hash: 089d47523488b88c6a41cd209b031e4ec817a3b19dd4cdee27f439b301433e8a
    repository_seed_hash: 1202b208c6d1302172adbea65eb4b2d93bef0d28a3b6a0d18e5e13a21b0fabf4
    selected_hash: 089d47523488b88c6a41cd209b031e4ec817a3b19dd4cdee27f439b301433e8a
    preserved_record_hash: 089d47523488b88c6a41cd209b031e4ec817a3b19dd4cdee27f439b301433e8a
    generated_markdown_sha256: bf6722370876c91cce24ed7e49a1e94eb903bf7c08c98f8e014aa1e4d1565a54
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260405-001
    canonical_change_id: LEGACY-QH-cl-20260405-001
    owner_db_hash: e8da7bc879b5578366d84b36103faf6ccb8c3e37e2a7598de0f94850fbbccf09
    local_storage_hash: e8da7bc879b5578366d84b36103faf6ccb8c3e37e2a7598de0f94850fbbccf09
    repository_seed_hash: 48a88e79f1d67864b3b12a2cea152ca487169fe459710937dd4dbcd087bc4656
    selected_hash: e8da7bc879b5578366d84b36103faf6ccb8c3e37e2a7598de0f94850fbbccf09
    preserved_record_hash: e8da7bc879b5578366d84b36103faf6ccb8c3e37e2a7598de0f94850fbbccf09
    generated_markdown_sha256: e43024385468962365919784ca94d452e6de1798f401fe2bbe7a5517fd97cbde
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes the Story Detail modal and review call to action used by Community Gallery and My Stories.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260405-002
    canonical_change_id: LEGACY-QH-cl-20260405-002
    owner_db_hash: f06961ef7bc87c176b49b64096e651e2adffaf7a5d872681d79ecb05f8da3e3f
    local_storage_hash: f06961ef7bc87c176b49b64096e651e2adffaf7a5d872681d79ecb05f8da3e3f
    repository_seed_hash: 118c9a907a464fc35260e5eacba26165774265693394357bae4fc529bd82e15f
    selected_hash: f06961ef7bc87c176b49b64096e651e2adffaf7a5d872681d79ecb05f8da3e3f
    preserved_record_hash: f06961ef7bc87c176b49b64096e651e2adffaf7a5d872681d79ecb05f8da3e3f
    generated_markdown_sha256: 4a0cd657e47ef027fd0f0de7afff6d1c7579724005e4135b94f3e848060cc526
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes the review modal and Story Detail review flow shared by Community Gallery and My Stories.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260410-001
    canonical_change_id: LEGACY-QH-cl-20260410-001
    owner_db_hash: d1ba09a60a4aaa600207a8cb78bfcbfbeac2bfb0a7de73ca5f5ffa591d5ccf52
    local_storage_hash: d1ba09a60a4aaa600207a8cb78bfcbfbeac2bfb0a7de73ca5f5ffa591d5ccf52
    repository_seed_hash: f88528dd9722b9430ea2d61ab5081f68b6483704db353fcec590940c5bc8d165
    selected_hash: d1ba09a60a4aaa600207a8cb78bfcbfbeac2bfb0a7de73ca5f5ffa591d5ccf52
    preserved_record_hash: d1ba09a60a4aaa600207a8cb78bfcbfbeac2bfb0a7de73ca5f5ffa591d5ccf52
    generated_markdown_sha256: ef790e971043be37c0154c1943cb7b073c4c0a92060c246ac5cf445a71de98cf
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record directly changes the Community Gallery discovery shell, category rail, search, and filters.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260411-001
    canonical_change_id: LEGACY-QH-cl-20260411-001
    owner_db_hash: 2d536317bd3e5453db386782a893f04d2712814b296861ec4a3f3c2bfdb1d366
    local_storage_hash: 2d536317bd3e5453db386782a893f04d2712814b296861ec4a3f3c2bfdb1d366
    repository_seed_hash: 11bac12543ea97e4940a660f041146f15530e5da055f84aedea85b4e08e4fdb0
    selected_hash: 2d536317bd3e5453db386782a893f04d2712814b296861ec4a3f3c2bfdb1d366
    preserved_record_hash: 2d536317bd3e5453db386782a893f04d2712814b296861ec4a3f3c2bfdb1d366
    generated_markdown_sha256: 770ef6ed0ac8f434b9e795ef82658a18adfd44c95059b872aeb9f5fbd18c8d65
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260411-002
    canonical_change_id: LEGACY-QH-cl-20260411-002
    owner_db_hash: c047944160f4e53334c9723bf4cafff7736facc05edf07137430b43dabb5a68f
    local_storage_hash: c047944160f4e53334c9723bf4cafff7736facc05edf07137430b43dabb5a68f
    repository_seed_hash: cd9aef5ca6e70f7b97916e29e5992d8c72df30fb2c8ae97c2fd5cad12553a83e
    selected_hash: c047944160f4e53334c9723bf4cafff7736facc05edf07137430b43dabb5a68f
    preserved_record_hash: c047944160f4e53334c9723bf4cafff7736facc05edf07137430b43dabb5a68f
    generated_markdown_sha256: bdb33282f2a1de869989478ce93d83455311c9d7dc21d80c02687aaa96a665b1
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record directly adds Community Gallery adult-content preference, confirmation, masking, and service behavior.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260411-003
    canonical_change_id: LEGACY-QH-cl-20260411-003
    owner_db_hash: 85b743b7b59b2e612af08d9319b62cead6c98501e25281a76454e505338798ba
    local_storage_hash: 85b743b7b59b2e612af08d9319b62cead6c98501e25281a76454e505338798ba
    repository_seed_hash: 91d124508fc10e7cef5b063a4299ea9935bc838d8303172a5d8ee83637cc1c24
    selected_hash: 85b743b7b59b2e612af08d9319b62cead6c98501e25281a76454e505338798ba
    preserved_record_hash: 85b743b7b59b2e612af08d9319b62cead6c98501e25281a76454e505338798ba
    generated_markdown_sha256: 2274b2fd69bd316a8eb753728166a513446a7adf923d82a01279192490d03ade
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260411-004
    canonical_change_id: LEGACY-QH-cl-20260411-004
    owner_db_hash: 00d0852cca1aaefff6a738d4fac5491b7b7947e455e1e5e234725b91c2424d41
    local_storage_hash: 00d0852cca1aaefff6a738d4fac5491b7b7947e455e1e5e234725b91c2424d41
    repository_seed_hash: 06a45f54d6b1ec9b99a501d1c5a6e5fa70aa94cee6b34da32781b86d5c1f89c5
    selected_hash: 00d0852cca1aaefff6a738d4fac5491b7b7947e455e1e5e234725b91c2424d41
    preserved_record_hash: 00d0852cca1aaefff6a738d4fac5491b7b7947e455e1e5e234725b91c2424d41
    generated_markdown_sha256: e4c487a9ffdf1a3effb5cede27fddc07498a1fc89e4c89e33ee82967a3ebde88
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260411-005
    canonical_change_id: LEGACY-QH-cl-20260411-005
    owner_db_hash: 9c04613969e3ce9c332442b2f90761bb9081a3bd8b5c12fa804a043048ff7f81
    local_storage_hash: 9c04613969e3ce9c332442b2f90761bb9081a3bd8b5c12fa804a043048ff7f81
    repository_seed_hash: 44bc7a1bb32fedc30ee72445d11519e594d55dbaf58365c527669f526631efa6
    selected_hash: 9c04613969e3ce9c332442b2f90761bb9081a3bd8b5c12fa804a043048ff7f81
    preserved_record_hash: 9c04613969e3ce9c332442b2f90761bb9081a3bd8b5c12fa804a043048ff7f81
    generated_markdown_sha256: 9a1bcb753472f54987697f27573f747e2d7f3c7551d9e7005e535c5645f304b7
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260412-001
    canonical_change_id: LEGACY-QH-cl-20260412-001
    owner_db_hash: 3f7ca4246734dd4dd619218ab35a2fb670acd2e25c4cf75cdeb88a8f39089bc6
    local_storage_hash: 3f7ca4246734dd4dd619218ab35a2fb670acd2e25c4cf75cdeb88a8f39089bc6
    repository_seed_hash: 731b4708b462521b343a3b62361fbf735a2857ed5014774ac9e94ea003222f53
    selected_hash: 3f7ca4246734dd4dd619218ab35a2fb670acd2e25c4cf75cdeb88a8f39089bc6
    preserved_record_hash: 3f7ca4246734dd4dd619218ab35a2fb670acd2e25c4cf75cdeb88a8f39089bc6
    generated_markdown_sha256: 28f04c6074f3095c10eb682eab280c1b5b6447b75a78a265e6fdc2c4d14f8817
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260412-002
    canonical_change_id: LEGACY-QH-cl-20260412-002
    owner_db_hash: 80bde3a36c5559651607ebc9ef3d5f9fad1e35f28956dd3743215017b98b3d9a
    local_storage_hash: 80bde3a36c5559651607ebc9ef3d5f9fad1e35f28956dd3743215017b98b3d9a
    repository_seed_hash: 216e7ad29de42efb197a48fca48b692f0c2d9bee538fb48399166121839806b7
    selected_hash: 80bde3a36c5559651607ebc9ef3d5f9fad1e35f28956dd3743215017b98b3d9a
    preserved_record_hash: 80bde3a36c5559651607ebc9ef3d5f9fad1e35f28956dd3743215017b98b3d9a
    generated_markdown_sha256: 209687472e241c2fdf4e460c290f811ec059667b3cba32c0ff71c785859effbf
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260412-003
    canonical_change_id: LEGACY-QH-cl-20260412-003
    owner_db_hash: f86ddb9f270814f41383751b6ca4dd913c1a064f71574e00828fafea54091723
    local_storage_hash: f86ddb9f270814f41383751b6ca4dd913c1a064f71574e00828fafea54091723
    repository_seed_hash: c388ce63cf881455eb4c35f9be7b1fdf62045783428af2fe4248ce5544e772a0
    selected_hash: f86ddb9f270814f41383751b6ca4dd913c1a064f71574e00828fafea54091723
    preserved_record_hash: f86ddb9f270814f41383751b6ca4dd913c1a064f71574e00828fafea54091723
    generated_markdown_sha256: e6cccf5010d87589f2ece5fe369091a92133b06bdbd3c19953d34c6fd73fccce
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260412-004
    canonical_change_id: LEGACY-QH-cl-20260412-004
    owner_db_hash: d94eda14cbfabe399c08521b74f4f503ca0469c23539f8d99f54eb4150aba9c4
    local_storage_hash: d94eda14cbfabe399c08521b74f4f503ca0469c23539f8d99f54eb4150aba9c4
    repository_seed_hash: e81ae0b6cffed33819e72727274cb30e8aafe3b8036d1bdf96e1238d6c4b35c0
    selected_hash: d94eda14cbfabe399c08521b74f4f503ca0469c23539f8d99f54eb4150aba9c4
    preserved_record_hash: d94eda14cbfabe399c08521b74f4f503ca0469c23539f8d99f54eb4150aba9c4
    generated_markdown_sha256: ea40522aeb6177a794a0577b5ffc5552f43b8d795915f9f72fc9b2ed9579b68f
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260412-005
    canonical_change_id: LEGACY-QH-cl-20260412-005
    owner_db_hash: 114d050c5bb6e1b025b256cc3110e520de2d6b2f446e8a223bac8a68f914baee
    local_storage_hash: 114d050c5bb6e1b025b256cc3110e520de2d6b2f446e8a223bac8a68f914baee
    repository_seed_hash: 0b67671c478ae3540edd64c8f9f787817e624cc3f2299d65322d39d6126fc5b8
    selected_hash: 114d050c5bb6e1b025b256cc3110e520de2d6b2f446e8a223bac8a68f914baee
    preserved_record_hash: 114d050c5bb6e1b025b256cc3110e520de2d6b2f446e8a223bac8a68f914baee
    generated_markdown_sha256: 98e51d2b2ce3d0c06bfb3dc914abd5dd36802135e3057280430b5c30b85feff4
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260412-006
    canonical_change_id: LEGACY-QH-cl-20260412-006
    owner_db_hash: cce61b92e3141d39be0f849a014ffa11c23de86a2c7846653e0fbf5893443b12
    local_storage_hash: cce61b92e3141d39be0f849a014ffa11c23de86a2c7846653e0fbf5893443b12
    repository_seed_hash: 447929671fce0d6f83701546ff42c010b256f0feb4458e65370a71ce91907b1d
    selected_hash: cce61b92e3141d39be0f849a014ffa11c23de86a2c7846653e0fbf5893443b12
    preserved_record_hash: cce61b92e3141d39be0f849a014ffa11c23de86a2c7846653e0fbf5893443b12
    generated_markdown_sha256: e34bcb3af731e5a173cef44d40df905a65925dafeec4388d69d57d1a2f671893
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260412-007
    canonical_change_id: LEGACY-QH-cl-20260412-007
    owner_db_hash: a68c6cc677df35e72db5bafaecc96b1336e98f292cfde15471c159f42bbdb23d
    local_storage_hash: a68c6cc677df35e72db5bafaecc96b1336e98f292cfde15471c159f42bbdb23d
    repository_seed_hash: 6c13e616cc1a4a8aea1ea8862976ac45397dce0e12a538236aceeffd5ab5ad3e
    selected_hash: a68c6cc677df35e72db5bafaecc96b1336e98f292cfde15471c159f42bbdb23d
    preserved_record_hash: a68c6cc677df35e72db5bafaecc96b1336e98f292cfde15471c159f42bbdb23d
    generated_markdown_sha256: ddce328f60c88d5e78d0eab0ca115779a0aee594980b711137e13e406ba4a6e7
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260412-008
    canonical_change_id: LEGACY-QH-cl-20260412-008
    owner_db_hash: 929614b562c899c33a1b50559fe058d082b7287c812f221113216b489820aed6
    local_storage_hash: 929614b562c899c33a1b50559fe058d082b7287c812f221113216b489820aed6
    repository_seed_hash: d8e2dd0a5e8d971659f8a78e8ad99887c761ab5de12c2384e810ce2bf2c0c3a4
    selected_hash: 929614b562c899c33a1b50559fe058d082b7287c812f221113216b489820aed6
    preserved_record_hash: 929614b562c899c33a1b50559fe058d082b7287c812f221113216b489820aed6
    generated_markdown_sha256: 0b599def01146e57f2900c7124b893e543f1ab5b3931ebd425505611d4dd0094
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260415-001
    canonical_change_id: LEGACY-QH-cl-20260415-001
    owner_db_hash: 070df2956f6a7332c1c88d71f47855f638d9886079cf38f528c15c1556478174
    local_storage_hash: 070df2956f6a7332c1c88d71f47855f638d9886079cf38f528c15c1556478174
    repository_seed_hash: 46dc5b28ba007a5149818ef0ae2f821d6c7e4914798caba845008dff8c8ddba5
    selected_hash: 070df2956f6a7332c1c88d71f47855f638d9886079cf38f528c15c1556478174
    preserved_record_hash: 070df2956f6a7332c1c88d71f47855f638d9886079cf38f528c15c1556478174
    generated_markdown_sha256: 21c8d839da7ea4afcb3cea289331848f6fd736f16ef47aa93911869e4a18fb73
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260416-001
    canonical_change_id: LEGACY-QH-cl-20260416-001
    owner_db_hash: a2ff713e2aa3a4d770d8d8483910ec37ecedabda745ac684b0da0f80790f5805
    local_storage_hash: a2ff713e2aa3a4d770d8d8483910ec37ecedabda745ac684b0da0f80790f5805
    repository_seed_hash: 2d4bf09be0d6fa2f939d9434e829a62e9fe1b0056d0de1133112a8d63cac6bf5
    selected_hash: a2ff713e2aa3a4d770d8d8483910ec37ecedabda745ac684b0da0f80790f5805
    preserved_record_hash: a2ff713e2aa3a4d770d8d8483910ec37ecedabda745ac684b0da0f80790f5805
    generated_markdown_sha256: d7b6f4cb72a42743b7b7b59f98f6e9d682aacf266285099e378c478e0e7c8886
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260416-002
    canonical_change_id: LEGACY-QH-cl-20260416-002
    owner_db_hash: 65a003066b1652796d8bd5f5fba1a2fecaf138e82662669e48887671ee5182e7
    local_storage_hash: 65a003066b1652796d8bd5f5fba1a2fecaf138e82662669e48887671ee5182e7
    repository_seed_hash: 83dcb9d35c34bc3a925b18738a529b21c85b491c518b76b1a65657f05b5223b3
    selected_hash: 65a003066b1652796d8bd5f5fba1a2fecaf138e82662669e48887671ee5182e7
    preserved_record_hash: 65a003066b1652796d8bd5f5fba1a2fecaf138e82662669e48887671ee5182e7
    generated_markdown_sha256: a09746b495f781fda7a32a738d4b8dfacef49f4dead27d54c50cdb402e62f475
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260417-001
    canonical_change_id: LEGACY-QH-cl-20260417-001
    owner_db_hash: 945a84530fe4f83a9836e4532b5e098727fb59c547a5e4081f1d9f616e5ea97d
    local_storage_hash: 945a84530fe4f83a9836e4532b5e098727fb59c547a5e4081f1d9f616e5ea97d
    repository_seed_hash: 48df28de2cb4c4db16f6ff0f70f3ffcec07ce504012ee4858e47f98f27b5e945
    selected_hash: 945a84530fe4f83a9836e4532b5e098727fb59c547a5e4081f1d9f616e5ea97d
    preserved_record_hash: 945a84530fe4f83a9836e4532b5e098727fb59c547a5e4081f1d9f616e5ea97d
    generated_markdown_sha256: 919cf04225a225743a2ee55412a5bad2a8189ea1834c06c486d79dd19cd6a45e
    source_lineage:
      - owner-db
      - local-storage
    source_difference: reviewed-substantive-collision
    conflict_resolution: selected-reviewed-owner-union-for-substantive-collision
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed contains a substantive same-ID variant across changes, createdAt, filesAffected, plan, problem, relatedRunIds, severity, summary, tags, title, updatedAt. Both variant hashes and the discarded seed-field set remain recorded, and no timestamp-based precedence was used.
    differing_fields:
      - changes
      - createdAt
      - filesAffected
      - plan
      - problem
      - relatedRunIds
      - severity
      - summary
      - tags
      - title
      - updatedAt
    semantic_duplicate_ids:
      - cl-20260417-008
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The selected owner record is a direct Community Gallery adult-content gating change; the same-ID seed collision is separately disclosed in the migration receipt.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260417-002
    canonical_change_id: LEGACY-QH-cl-20260417-002
    owner_db_hash: 5bea696413ce2f94f229d42c1f1ecf20462f01f7707241e1e56328bee1455709
    local_storage_hash: 5bea696413ce2f94f229d42c1f1ecf20462f01f7707241e1e56328bee1455709
    repository_seed_hash: f686dcc70b05d159f3fc0d9c2fee4006b39badca5217504a3a7725fd7222735f
    selected_hash: 5bea696413ce2f94f229d42c1f1ecf20462f01f7707241e1e56328bee1455709
    preserved_record_hash: 5bea696413ce2f94f229d42c1f1ecf20462f01f7707241e1e56328bee1455709
    generated_markdown_sha256: fcab5872dbcaa159c61af5667543f4060ce698a5e1382e07e28f1497e0efe52d
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record moves the Community Gallery feed selector and adult-content control into AppShellTopBar.tsx.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260417-003
    canonical_change_id: LEGACY-QH-cl-20260417-003
    owner_db_hash: 4fa5295270e101a8fccbca221083268724d0b06ef32a16d84e5a6a40eb08206f
    local_storage_hash: 4fa5295270e101a8fccbca221083268724d0b06ef32a16d84e5a6a40eb08206f
    repository_seed_hash: 0772c4738cde769a9e5ae8d1c4e3d59c7d3a651e417e46342369e8b25e49a2c8
    selected_hash: 4fa5295270e101a8fccbca221083268724d0b06ef32a16d84e5a6a40eb08206f
    preserved_record_hash: 4fa5295270e101a8fccbca221083268724d0b06ef32a16d84e5a6a40eb08206f
    generated_markdown_sha256: f080f61f50b287218002193625fcddf8317d0f40883524e90febc10aa6d708b6
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record moves guest-workspace protection into use-index-shell-bootstrap.ts, including the branch that returns signed-out users from protected Chronicle workspaces to Community Gallery.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260417-004
    canonical_change_id: LEGACY-QH-cl-20260417-004
    owner_db_hash: 2c201f121bb19cd9ea678a4d1833cadeb20eee84969347d3c452d45ce7bbb28f
    local_storage_hash: 2c201f121bb19cd9ea678a4d1833cadeb20eee84969347d3c452d45ce7bbb28f
    repository_seed_hash: 0e720caf66c114a67aec248d33dec3c271a333ef9c5c352b10b205838b2f7d61
    selected_hash: 2c201f121bb19cd9ea678a4d1833cadeb20eee84969347d3c452d45ce7bbb28f
    preserved_record_hash: 2c201f121bb19cd9ea678a4d1833cadeb20eee84969347d3c452d45ce7bbb28f
    generated_markdown_sha256: 75dc2dd69f2bc4e8ace7d60b8fd5008f3871857fa8f66a7567aecf4f22dc26ca
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260417-005
    canonical_change_id: LEGACY-QH-cl-20260417-005
    owner_db_hash: 907e3b1b0ee3b610c1bc746bb8b9040232bf59383a35f0c20b5ead54e5188932
    local_storage_hash: 907e3b1b0ee3b610c1bc746bb8b9040232bf59383a35f0c20b5ead54e5188932
    repository_seed_hash: 5c794a7fd4084b476972a4307bcc52d7da2d5e40bb5feffa181fd50516c3238e
    selected_hash: 907e3b1b0ee3b610c1bc746bb8b9040232bf59383a35f0c20b5ead54e5188932
    preserved_record_hash: 907e3b1b0ee3b610c1bc746bb8b9040232bf59383a35f0c20b5ead54e5188932
    generated_markdown_sha256: 68716dc3d25e3d6c0016ffaf5d49f91efa63615e85187be2e6bf809bc85f8ee2
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record moves authentication-dialog state used when signed-out Gallery visitors attempt protected Like, Save, and Review actions.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260417-006
    canonical_change_id: LEGACY-QH-cl-20260417-006
    owner_db_hash: 866c6220c9a6c330a0977e1d81e92b8d56272dc8924ae64497d4666a1b74c099
    local_storage_hash: 866c6220c9a6c330a0977e1d81e92b8d56272dc8924ae64497d4666a1b74c099
    repository_seed_hash: ceff5dfa27a9d74f1568d67896a94cdd2983c3c319874197e5aad629f6b846a8
    selected_hash: 866c6220c9a6c330a0977e1d81e92b8d56272dc8924ae64497d4666a1b74c099
    preserved_record_hash: 866c6220c9a6c330a0977e1d81e92b8d56272dc8924ae64497d4666a1b74c099
    generated_markdown_sha256: a57a90028ab0a8813c35b028e63aacbbccbd0d2f460ad42fbabc1161d1286b74
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260417-007
    canonical_change_id: LEGACY-QH-cl-20260417-007
    owner_db_hash: 03ef4d196b08920ffbddc97bd9662314a3e2b35e14c093040747e55e8e4ccf6c
    local_storage_hash: 03ef4d196b08920ffbddc97bd9662314a3e2b35e14c093040747e55e8e4ccf6c
    repository_seed_hash: 0f85c14b5e11b6e48e054da330face3091e75d2ef459f1509ce376acb7a01b0b
    selected_hash: 03ef4d196b08920ffbddc97bd9662314a3e2b35e14c093040747e55e8e4ccf6c
    preserved_record_hash: 03ef4d196b08920ffbddc97bd9662314a3e2b35e14c093040747e55e8e4ccf6c
    generated_markdown_sha256: 0b278e5508ea484c603dd0fc683c39422f80ecbccdd3edaa187acb392bbc87e3
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record moves Gallery Play and editable-copy handoffs into use-index-scenario-lifecycle.ts, the runtime owner that receives Community Gallery story selections.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260417-008
    canonical_change_id: LEGACY-QH-cl-20260417-008
    owner_db_hash: d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1
    local_storage_hash: d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1
    repository_seed_hash: d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1
    selected_hash: d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1
    preserved_record_hash: d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1
    generated_markdown_sha256: 5afd72fd824605420208bb3287025f712cd4b9bad23c38d85ddd20253d22f738
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids:
      - cl-20260417-001
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record directly changes Community Gallery adult-content gating for the toggle and masked story cards.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-001
    canonical_change_id: LEGACY-QH-cl-20260418-001
    owner_db_hash: de27b3cb57a717a3759ba9d39708b01f5edeabd1fa58e4a205379a74fe5c4bc6
    local_storage_hash: de27b3cb57a717a3759ba9d39708b01f5edeabd1fa58e4a205379a74fe5c4bc6
    repository_seed_hash: b6ad70a63131abd8fd4fd9557c81d4800376a2c34f3ac5705a3165cd94f03864
    selected_hash: de27b3cb57a717a3759ba9d39708b01f5edeabd1fa58e4a205379a74fe5c4bc6
    preserved_record_hash: de27b3cb57a717a3759ba9d39708b01f5edeabd1fa58e4a205379a74fe5c4bc6
    generated_markdown_sha256: 7d31019e1e8497c921c1bc6d55d869e1ea925645e6a99c839363e708f3808f02
    source_lineage:
      - owner-db
      - local-storage
    source_difference: reviewed-substantive-collision
    conflict_resolution: selected-reviewed-owner-union-for-substantive-collision
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed contains a substantive same-ID variant across changes, createdAt, filesAffected, plan, problem, relatedRunIds, severity, summary, tags, title, updatedAt. Both variant hashes and the discarded seed-field set remain recorded, and no timestamp-based precedence was used.
    differing_fields:
      - changes
      - createdAt
      - filesAffected
      - plan
      - problem
      - relatedRunIds
      - severity
      - summary
      - tags
      - title
      - updatedAt
    semantic_duplicate_ids:
      - cl-20260418-011
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-002
    canonical_change_id: LEGACY-QH-cl-20260418-002
    owner_db_hash: 75b8f8578786720325a4c4b87e749db4a988707bd562d250a46293dbf7761970
    local_storage_hash: 75b8f8578786720325a4c4b87e749db4a988707bd562d250a46293dbf7761970
    repository_seed_hash: fb028dc4d640152d4f8bfa3a1b0fab385e531d2dcb2fea2253838a3436d1de37
    selected_hash: 75b8f8578786720325a4c4b87e749db4a988707bd562d250a46293dbf7761970
    preserved_record_hash: 75b8f8578786720325a4c4b87e749db4a988707bd562d250a46293dbf7761970
    generated_markdown_sha256: 493a84cac2ba6cf641a31ba25d2c743c0a7fc54be720eaaed1a57fca990bc1c7
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-003
    canonical_change_id: LEGACY-QH-cl-20260418-003
    owner_db_hash: c7cd52022677d89bef5056d81465739b111350279102c7993ab523c5c6076d64
    local_storage_hash: c7cd52022677d89bef5056d81465739b111350279102c7993ab523c5c6076d64
    repository_seed_hash: 02103892b153e857e9127ba6c7f4bdfff933dad67697563affdaa3e5af9dedb8
    selected_hash: c7cd52022677d89bef5056d81465739b111350279102c7993ab523c5c6076d64
    preserved_record_hash: c7cd52022677d89bef5056d81465739b111350279102c7993ab523c5c6076d64
    generated_markdown_sha256: 8f7b3abdca3ff76309aa4cea9e4b583232621983290f074af9fe18489f66ba30
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-004
    canonical_change_id: LEGACY-QH-cl-20260418-004
    owner_db_hash: 7bdb138131bf1e58c6a887f59c919e8e90e1491b0dd307028c31f56cc6bc663b
    local_storage_hash: 7bdb138131bf1e58c6a887f59c919e8e90e1491b0dd307028c31f56cc6bc663b
    repository_seed_hash: d91debc46be8fa12e2f036454c0a5e45a8a5e25e2de58efc8f2b652b8d076b6b
    selected_hash: 7bdb138131bf1e58c6a887f59c919e8e90e1491b0dd307028c31f56cc6bc663b
    preserved_record_hash: 7bdb138131bf1e58c6a887f59c919e8e90e1491b0dd307028c31f56cc6bc663b
    generated_markdown_sha256: 50e480645a2526c27773f4379bda61d0aa38fd3c6b9f7b3ccc72a99a35b089ca
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-005
    canonical_change_id: LEGACY-QH-cl-20260418-005
    owner_db_hash: 2b75d76432366e2804031b711a405a5bdf4e5930db5501f9dcdd34ebe95db45d
    local_storage_hash: 2b75d76432366e2804031b711a405a5bdf4e5930db5501f9dcdd34ebe95db45d
    repository_seed_hash: 8666070d4c371b494186ff8230065f190a01773f2d6a463426a9f9a45075bc38
    selected_hash: 2b75d76432366e2804031b711a405a5bdf4e5930db5501f9dcdd34ebe95db45d
    preserved_record_hash: 2b75d76432366e2804031b711a405a5bdf4e5930db5501f9dcdd34ebe95db45d
    generated_markdown_sha256: 13006a9d0e95ba562a9d6a90f7b492f253d88b6b5b909035660f39b0373f6b19
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-006
    canonical_change_id: LEGACY-QH-cl-20260418-006
    owner_db_hash: 4138a830bb6ec6452815f119422dd834d7040c72dbe75e934a1509057a81ae04
    local_storage_hash: 4138a830bb6ec6452815f119422dd834d7040c72dbe75e934a1509057a81ae04
    repository_seed_hash: a72e2ed956d1583e3237edc842ad890fda649874bffdb125f4ddf0bfe0691271
    selected_hash: 4138a830bb6ec6452815f119422dd834d7040c72dbe75e934a1509057a81ae04
    preserved_record_hash: 4138a830bb6ec6452815f119422dd834d7040c72dbe75e934a1509057a81ae04
    generated_markdown_sha256: 3ce1b0cd01d86633183ec801a200ce9e9923491b86cd5d1c076a72f82d426d36
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-007
    canonical_change_id: LEGACY-QH-cl-20260418-007
    owner_db_hash: 10ed8277bd1ce76d2a9b635dc6e650ccc124f6a87d2a978a0f89b84727fc3b37
    local_storage_hash: 10ed8277bd1ce76d2a9b635dc6e650ccc124f6a87d2a978a0f89b84727fc3b37
    repository_seed_hash: 79199fb9f19e0b3005a49f6218de06a46dc4483c350e2e85b5d17314d58cdc4c
    selected_hash: 10ed8277bd1ce76d2a9b635dc6e650ccc124f6a87d2a978a0f89b84727fc3b37
    preserved_record_hash: 10ed8277bd1ce76d2a9b635dc6e650ccc124f6a87d2a978a0f89b84727fc3b37
    generated_markdown_sha256: eb7667c8e2ecb46d04e39c0903416a818302f909742e1002d09074cc8a937c1a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-008
    canonical_change_id: LEGACY-QH-cl-20260418-008
    owner_db_hash: 9a744aae57021f391183a59245415362c780502458728f05eef93c586e93804e
    local_storage_hash: 9a744aae57021f391183a59245415362c780502458728f05eef93c586e93804e
    repository_seed_hash: 5bbe34723966fb5f82a30f3304e7a64bc8c12529ec66c1e84ab86c231d7ef53c
    selected_hash: 9a744aae57021f391183a59245415362c780502458728f05eef93c586e93804e
    preserved_record_hash: 9a744aae57021f391183a59245415362c780502458728f05eef93c586e93804e
    generated_markdown_sha256: 062928b96a457c4218791ae4b02fd45cf5d2ea3ba0063f2ead37695e1ab756d4
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-009
    canonical_change_id: LEGACY-QH-cl-20260418-009
    owner_db_hash: c5922471a6f388135b92ebeef6e5bfc874bde12f69ab8fcc77ed7e1dd5849db6
    local_storage_hash: c5922471a6f388135b92ebeef6e5bfc874bde12f69ab8fcc77ed7e1dd5849db6
    repository_seed_hash: 0c840adf266307dd1637f754063d025455f3afeb80ff3a48552aae7c2e11e7b3
    selected_hash: c5922471a6f388135b92ebeef6e5bfc874bde12f69ab8fcc77ed7e1dd5849db6
    preserved_record_hash: c5922471a6f388135b92ebeef6e5bfc874bde12f69ab8fcc77ed7e1dd5849db6
    generated_markdown_sha256: 24b07e6a84f2eefa76ddcc8235763f42496bdc1e7e00bde176f373a6ebca0fd2
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-010
    canonical_change_id: LEGACY-QH-cl-20260418-010
    owner_db_hash: 35a2d3a3f35336221b479a614dfd158b198d7cdc953746e0f1e5ea7df51a4524
    local_storage_hash: 35a2d3a3f35336221b479a614dfd158b198d7cdc953746e0f1e5ea7df51a4524
    repository_seed_hash: 8d8a56014970063456a99cf644d12f3062707d7e88e5e0f45e4a48fc3669231d
    selected_hash: 35a2d3a3f35336221b479a614dfd158b198d7cdc953746e0f1e5ea7df51a4524
    preserved_record_hash: 35a2d3a3f35336221b479a614dfd158b198d7cdc953746e0f1e5ea7df51a4524
    generated_markdown_sha256: cead1b2b65cc2b72a5eb47dc489fba22847b55dfaa4351415ead7403fe3c3703
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260418-011
    canonical_change_id: LEGACY-QH-cl-20260418-011
    owner_db_hash: dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f
    local_storage_hash: dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f
    repository_seed_hash: dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f
    selected_hash: dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f
    preserved_record_hash: dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f
    generated_markdown_sha256: 0b360ea6e75b88c62732efa2324635ba0eebe1d628b8dfb7c9317e682544669b
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids:
      - cl-20260418-001
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-001
    canonical_change_id: LEGACY-QH-cl-20260419-001
    owner_db_hash: 54f79e939112201c8f89b98e6ddc89935a9edb4c0f5bb6affb38d393aaeeac50
    local_storage_hash: 54f79e939112201c8f89b98e6ddc89935a9edb4c0f5bb6affb38d393aaeeac50
    repository_seed_hash: fef88e7422b838debc175fa467fa7d86e6ba0c0545718442ca4ec56d0512000f
    selected_hash: 54f79e939112201c8f89b98e6ddc89935a9edb4c0f5bb6affb38d393aaeeac50
    preserved_record_hash: 54f79e939112201c8f89b98e6ddc89935a9edb4c0f5bb6affb38d393aaeeac50
    generated_markdown_sha256: 5fc59c1ff70a7305b9b15b4938d364ab755c7eee8bb503e496be2a619853ae91
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-002
    canonical_change_id: LEGACY-QH-cl-20260419-002
    owner_db_hash: b430ef738c4a4690cd1594b3223a4ef778f3bc4f62a5c3ea3fb2568bad7d77e7
    local_storage_hash: b430ef738c4a4690cd1594b3223a4ef778f3bc4f62a5c3ea3fb2568bad7d77e7
    repository_seed_hash: 120c6b51176e5694ae1b659858fe0988020510bf7f09243095975a242a52e9b3
    selected_hash: b430ef738c4a4690cd1594b3223a4ef778f3bc4f62a5c3ea3fb2568bad7d77e7
    preserved_record_hash: b430ef738c4a4690cd1594b3223a4ef778f3bc4f62a5c3ea3fb2568bad7d77e7
    generated_markdown_sha256: ff29d08c5783b05ff97b759616af55d277b76cfd11830f35b90dd494aa034209
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-003
    canonical_change_id: LEGACY-QH-cl-20260419-003
    owner_db_hash: f08ecfed45a0fb9072f7b29587c2f4a7dbf47696ca1710e815cb9c78c1b2c3b8
    local_storage_hash: f08ecfed45a0fb9072f7b29587c2f4a7dbf47696ca1710e815cb9c78c1b2c3b8
    repository_seed_hash: b272ad8afd4a8dfecdea8db19b8f29172d42a26dad6e5a068b11c649b8828cc1
    selected_hash: f08ecfed45a0fb9072f7b29587c2f4a7dbf47696ca1710e815cb9c78c1b2c3b8
    preserved_record_hash: f08ecfed45a0fb9072f7b29587c2f4a7dbf47696ca1710e815cb9c78c1b2c3b8
    generated_markdown_sha256: 9119b3ebd3c0786e4a6ebc09499395cfb5a97b6d6414be5e88f6f41dd750f64a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-004
    canonical_change_id: LEGACY-QH-cl-20260419-004
    owner_db_hash: 4d07e8718b18e119b8324a2ca0fca127404247b6766a99cbfe6bf42ba64debd7
    local_storage_hash: 4d07e8718b18e119b8324a2ca0fca127404247b6766a99cbfe6bf42ba64debd7
    repository_seed_hash: 7144dc68ae67f96885e116ea7cc5099fe0a5d6ff3cd1792967de398956d7ea14
    selected_hash: 4d07e8718b18e119b8324a2ca0fca127404247b6766a99cbfe6bf42ba64debd7
    preserved_record_hash: 4d07e8718b18e119b8324a2ca0fca127404247b6766a99cbfe6bf42ba64debd7
    generated_markdown_sha256: c896cbd840169fb30e5312529b1d0e3fa998a9efc037e171d35dc9923c9cdd75
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-005
    canonical_change_id: LEGACY-QH-cl-20260419-005
    owner_db_hash: 494867ffc84390a1eb5816ed5bcee3cca46f271acceff5c791ab8ab23aaf7ac6
    local_storage_hash: 494867ffc84390a1eb5816ed5bcee3cca46f271acceff5c791ab8ab23aaf7ac6
    repository_seed_hash: 9c33f8720d1dd9e7f5303152c187f83d817c29c32b5ea00efd2b0bb9d83e28a8
    selected_hash: 494867ffc84390a1eb5816ed5bcee3cca46f271acceff5c791ab8ab23aaf7ac6
    preserved_record_hash: 494867ffc84390a1eb5816ed5bcee3cca46f271acceff5c791ab8ab23aaf7ac6
    generated_markdown_sha256: 65e5cf99dcc89edf923413d76dfda5b3f5e5e9fbf23ca40040c8317dcaadf835
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-006
    canonical_change_id: LEGACY-QH-cl-20260419-006
    owner_db_hash: a22c95adb79c31c5d91a2e1864f6bfaeea255594a1b122c393cba1f1dece0a8d
    local_storage_hash: a22c95adb79c31c5d91a2e1864f6bfaeea255594a1b122c393cba1f1dece0a8d
    repository_seed_hash: ed290ef860e05b84405473a4244805bc24752fc1c6faf165e6ab9476304e1633
    selected_hash: a22c95adb79c31c5d91a2e1864f6bfaeea255594a1b122c393cba1f1dece0a8d
    preserved_record_hash: a22c95adb79c31c5d91a2e1864f6bfaeea255594a1b122c393cba1f1dece0a8d
    generated_markdown_sha256: e187b0169f74448bce19dacb4be920087e40a71ea78848cfcb16b51045a42d3c
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-007
    canonical_change_id: LEGACY-QH-cl-20260419-007
    owner_db_hash: e8e8c2c8ea58a8b6eeb97a187c037a6df6ebf60d2d1688f8797bf80787d62d5f
    local_storage_hash: e8e8c2c8ea58a8b6eeb97a187c037a6df6ebf60d2d1688f8797bf80787d62d5f
    repository_seed_hash: aa32d40fe5f18e33df79ea44c82591bd9ecb5c2f6368279c52c7ba7d37c6dfa9
    selected_hash: e8e8c2c8ea58a8b6eeb97a187c037a6df6ebf60d2d1688f8797bf80787d62d5f
    preserved_record_hash: e8e8c2c8ea58a8b6eeb97a187c037a6df6ebf60d2d1688f8797bf80787d62d5f
    generated_markdown_sha256: aa3923d930d3839fc8cb0064bc0b44907c183440a19f5be04f519b1f17eab336
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-008
    canonical_change_id: LEGACY-QH-cl-20260419-008
    owner_db_hash: bd2e2511b54dda62469083928793638ee68a244445d863b1b5fcca17ff4e8c56
    local_storage_hash: bd2e2511b54dda62469083928793638ee68a244445d863b1b5fcca17ff4e8c56
    repository_seed_hash: d6051f5752d8d386967c6c504b5df5a9e3912b157f87b06b6b6acd2cd29d604b
    selected_hash: bd2e2511b54dda62469083928793638ee68a244445d863b1b5fcca17ff4e8c56
    preserved_record_hash: bd2e2511b54dda62469083928793638ee68a244445d863b1b5fcca17ff4e8c56
    generated_markdown_sha256: 7ae120610e1a84907a1797094ed6cd1a6cb0b08c3ea2dacb7870e6c2740e5b3e
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-009
    canonical_change_id: LEGACY-QH-cl-20260419-009
    owner_db_hash: d74230b9b24650a93c046b9372e7dd3788d0ae5343485576525b7f8dc21c360f
    local_storage_hash: d74230b9b24650a93c046b9372e7dd3788d0ae5343485576525b7f8dc21c360f
    repository_seed_hash: 114577ed640887e5d0a1e8d896ee3c84e02a451258a1e4ed0e58b416ecb2a149
    selected_hash: d74230b9b24650a93c046b9372e7dd3788d0ae5343485576525b7f8dc21c360f
    preserved_record_hash: d74230b9b24650a93c046b9372e7dd3788d0ae5343485576525b7f8dc21c360f
    generated_markdown_sha256: f3af1a1c4f584be33a22907f1616bc770e9d1751df8c3fa5c09f2a0225c84cc0
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-010
    canonical_change_id: LEGACY-QH-cl-20260419-010
    owner_db_hash: 38b6106929d852da88644f1bc335119d75855f8db74b477be57a0c76aeeff6da
    local_storage_hash: 38b6106929d852da88644f1bc335119d75855f8db74b477be57a0c76aeeff6da
    repository_seed_hash: 6b76e1643c483b4d1d3427b4efdffa506de3d06fb06631b8d0a0878d84db9df7
    selected_hash: 38b6106929d852da88644f1bc335119d75855f8db74b477be57a0c76aeeff6da
    preserved_record_hash: 38b6106929d852da88644f1bc335119d75855f8db74b477be57a0c76aeeff6da
    generated_markdown_sha256: dd4964ee3ba3acdab659083a4b73f8565055ce938ed5cd44aeef6a099c384c26
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-011
    canonical_change_id: LEGACY-QH-cl-20260419-011
    owner_db_hash: 8e9b666de40cfca64bef67a58a915e315714d7cbd00f8b13620d4db1a29b9d06
    local_storage_hash: 8e9b666de40cfca64bef67a58a915e315714d7cbd00f8b13620d4db1a29b9d06
    repository_seed_hash: 6ff8029efe88a70fadb0bcff8c423b0af24d3f000da89e6ed091ca4d11bce298
    selected_hash: 8e9b666de40cfca64bef67a58a915e315714d7cbd00f8b13620d4db1a29b9d06
    preserved_record_hash: 8e9b666de40cfca64bef67a58a915e315714d7cbd00f8b13620d4db1a29b9d06
    generated_markdown_sha256: add452e32bb3ff9a41e4775ff54fe23a091941aa0c974ae973373416f7da69f5
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260419-012
    canonical_change_id: LEGACY-QH-cl-20260419-012
    owner_db_hash: 35a987193ce676e1289aba38cf439a27b702997b11fa6f6177397ee36a11fe05
    local_storage_hash: 35a987193ce676e1289aba38cf439a27b702997b11fa6f6177397ee36a11fe05
    repository_seed_hash: 0d2ffd4330973a1409c2dc1f5c2a87e9755b899f3e5170708894cc77a3d59d44
    selected_hash: 35a987193ce676e1289aba38cf439a27b702997b11fa6f6177397ee36a11fe05
    preserved_record_hash: 35a987193ce676e1289aba38cf439a27b702997b11fa6f6177397ee36a11fe05
    generated_markdown_sha256: e809f745d778f9c6315218d04d5b93bdbed0124ddf7aefb3964cae88bab83c94
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260421-001
    canonical_change_id: LEGACY-QH-cl-20260421-001
    owner_db_hash: 2d392195f5a692b8f251ea4b4410d2a896e664e3671bde60f41df3142cecdc2b
    local_storage_hash: 2d392195f5a692b8f251ea4b4410d2a896e664e3671bde60f41df3142cecdc2b
    repository_seed_hash: 86c73570c479ae1c20e73a4256c9db72e56cb8e1e74783806b51abe63c99a3e5
    selected_hash: 2d392195f5a692b8f251ea4b4410d2a896e664e3671bde60f41df3142cecdc2b
    preserved_record_hash: 2d392195f5a692b8f251ea4b4410d2a896e664e3671bde60f41df3142cecdc2b
    generated_markdown_sha256: ca00c783c26cb51545d8de9262e08c5e4f5a4a4a1ae3dd0610b48da1f9a50488
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260421-002
    canonical_change_id: LEGACY-QH-cl-20260421-002
    owner_db_hash: 4f8e12eb2e7366ff0a7b4b773a4fbc93c8be9a0c80731de66c0a0916ea18fed9
    local_storage_hash: 4f8e12eb2e7366ff0a7b4b773a4fbc93c8be9a0c80731de66c0a0916ea18fed9
    repository_seed_hash: d82a151f93b97833e9d020eac944c843195f3299b598336e4eb67d68fb10ab8b
    selected_hash: 4f8e12eb2e7366ff0a7b4b773a4fbc93c8be9a0c80731de66c0a0916ea18fed9
    preserved_record_hash: 4f8e12eb2e7366ff0a7b4b773a4fbc93c8be9a0c80731de66c0a0916ea18fed9
    generated_markdown_sha256: 69b673e5029597b8dd8ebde690e41b0f000ae128dac400c5eb83b94bdc34060b
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260421-003
    canonical_change_id: LEGACY-QH-cl-20260421-003
    owner_db_hash: 88a2cf09c994e9f3f8eeac14e17af8dd96f65056d33d85f59d83879be3ae3a3a
    local_storage_hash: 88a2cf09c994e9f3f8eeac14e17af8dd96f65056d33d85f59d83879be3ae3a3a
    repository_seed_hash: ac4998a2c4d2f067c239a911d24df788dc68b425c12e113b625b5d97f6e7053b
    selected_hash: 88a2cf09c994e9f3f8eeac14e17af8dd96f65056d33d85f59d83879be3ae3a3a
    preserved_record_hash: 88a2cf09c994e9f3f8eeac14e17af8dd96f65056d33d85f59d83879be3ae3a3a
    generated_markdown_sha256: 69f9adfa097600810209c492303dc725786448df6731378905582d613cce6fca
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260422-001
    canonical_change_id: LEGACY-QH-cl-20260422-001
    owner_db_hash: 6e454b1cd70169488fd1e7985389777d17d6f40869d70c7ba46dde48373aaa18
    local_storage_hash: 6e454b1cd70169488fd1e7985389777d17d6f40869d70c7ba46dde48373aaa18
    repository_seed_hash: 69fe2803f403fa233845be23fff36016095accca67e9f4cacfb16495148d629d
    selected_hash: 6e454b1cd70169488fd1e7985389777d17d6f40869d70c7ba46dde48373aaa18
    preserved_record_hash: 6e454b1cd70169488fd1e7985389777d17d6f40869d70c7ba46dde48373aaa18
    generated_markdown_sha256: 12b149f9910d4fe54f5f36fa77d2f8c4f79c390827a27d187f7a82d21eba4748
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260422-002
    canonical_change_id: LEGACY-QH-cl-20260422-002
    owner_db_hash: 42da84965fbeb2743b394b4f3a255bab6a32e7cb1d3989b259d4e4b6efbea75e
    local_storage_hash: 42da84965fbeb2743b394b4f3a255bab6a32e7cb1d3989b259d4e4b6efbea75e
    repository_seed_hash: 7fa7c855dab3fb54dd1426360281387f9a0b0fadbc3397c58acbd134a4710ba8
    selected_hash: 42da84965fbeb2743b394b4f3a255bab6a32e7cb1d3989b259d4e4b6efbea75e
    preserved_record_hash: 42da84965fbeb2743b394b4f3a255bab6a32e7cb1d3989b259d4e4b6efbea75e
    generated_markdown_sha256: e898d003811f89000f82014e82fe70984e33e4c3351b69a7ad462302645569d9
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-001
    canonical_change_id: LEGACY-QH-cl-20260425-001
    owner_db_hash: b147471d7534f49c8ec586e4130f26ded63bd0c95a4f97246eb23e835a5b520d
    local_storage_hash: b147471d7534f49c8ec586e4130f26ded63bd0c95a4f97246eb23e835a5b520d
    repository_seed_hash: 474c104230cade65816190a96c8ff34588bdda6e25273c75d881e720df405412
    selected_hash: b147471d7534f49c8ec586e4130f26ded63bd0c95a4f97246eb23e835a5b520d
    preserved_record_hash: b147471d7534f49c8ec586e4130f26ded63bd0c95a4f97246eb23e835a5b520d
    generated_markdown_sha256: ecaed0536fe6660d64441413b4f7c9fc76253b5d11d8a7dc09b99ea7243e34e1
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-002
    canonical_change_id: LEGACY-QH-cl-20260425-002
    owner_db_hash: 6e46fad5040ae8bb50a01409b023905fb95af7fcd312d33dcdec9167206a528a
    local_storage_hash: 6e46fad5040ae8bb50a01409b023905fb95af7fcd312d33dcdec9167206a528a
    repository_seed_hash: 600aea1f7fda7ca32c225a9bc0c4968b90497dc54c5486687a4e8e8b19f75be8
    selected_hash: 6e46fad5040ae8bb50a01409b023905fb95af7fcd312d33dcdec9167206a528a
    preserved_record_hash: 6e46fad5040ae8bb50a01409b023905fb95af7fcd312d33dcdec9167206a528a
    generated_markdown_sha256: cd579ba49fcf99e48d9b9898a0f5210a3855ee50e9e606b724e45d7d4d9f451a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-003
    canonical_change_id: LEGACY-QH-cl-20260425-003
    owner_db_hash: 1b3abf1e3568932f98744002330fd798f25d5075c405ba92fd6d4d8740c0aa45
    local_storage_hash: 1b3abf1e3568932f98744002330fd798f25d5075c405ba92fd6d4d8740c0aa45
    repository_seed_hash: 28f15c24646c655d11e3c8f4db6f98236c4e12922a488be997ad566ed205ab51
    selected_hash: 1b3abf1e3568932f98744002330fd798f25d5075c405ba92fd6d4d8740c0aa45
    preserved_record_hash: 1b3abf1e3568932f98744002330fd798f25d5075c405ba92fd6d4d8740c0aa45
    generated_markdown_sha256: ffbafa634ac139fbd3e94423b8a48c79962047c8ae9f5ac686b3c7c683bf26bc
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-004
    canonical_change_id: LEGACY-QH-cl-20260425-004
    owner_db_hash: 6e3356b8852cdbda16d49ad14689edb24938047e58c6097d6a3b08f545b05f67
    local_storage_hash: 6e3356b8852cdbda16d49ad14689edb24938047e58c6097d6a3b08f545b05f67
    repository_seed_hash: 7e147d9e0755167a9e54ae19bf00df615f8a257a49a0fed4db78ae6639ffedc7
    selected_hash: 6e3356b8852cdbda16d49ad14689edb24938047e58c6097d6a3b08f545b05f67
    preserved_record_hash: 6e3356b8852cdbda16d49ad14689edb24938047e58c6097d6a3b08f545b05f67
    generated_markdown_sha256: bb35bab908792ba34c88ab04cd36c4c616e6f7ffd537d3e10e78f6728758771e
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-005
    canonical_change_id: LEGACY-QH-cl-20260425-005
    owner_db_hash: 4ead933d9840b5d0a62bd1dd34189efa599774e7b3e579c287e7e2401a2a2a9a
    local_storage_hash: 4ead933d9840b5d0a62bd1dd34189efa599774e7b3e579c287e7e2401a2a2a9a
    repository_seed_hash: 9c5292a02de013a3daefaeb15f942a30bdd0f0f17c5fa80225253e1899c31031
    selected_hash: 4ead933d9840b5d0a62bd1dd34189efa599774e7b3e579c287e7e2401a2a2a9a
    preserved_record_hash: 4ead933d9840b5d0a62bd1dd34189efa599774e7b3e579c287e7e2401a2a2a9a
    generated_markdown_sha256: 89bca7ec507ed51b28e2dc3bdb80f76f734519c8e5bd0ee615c1d7387539075f
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-006
    canonical_change_id: LEGACY-QH-cl-20260425-006
    owner_db_hash: 7b417225cac1d13e4599c9f75ee3a5f1255a158625acaea953b7389bc9fde904
    local_storage_hash: 7b417225cac1d13e4599c9f75ee3a5f1255a158625acaea953b7389bc9fde904
    repository_seed_hash: 2c3c26efbb82a0a0d271b69987cfb29067f74a35fc64db10ed7084a77791f504
    selected_hash: 7b417225cac1d13e4599c9f75ee3a5f1255a158625acaea953b7389bc9fde904
    preserved_record_hash: 08431520cc2085d00fa53381af6ed7c230bc3697509c415276181c000fa46dac
    generated_markdown_sha256: fad688b8da55d4ae6cf4790a63b44cfb2fe7c83f2ef776438f0f5d0957d505c1
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: filesAffected[1]
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[2]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-007
    canonical_change_id: LEGACY-QH-cl-20260425-007
    owner_db_hash: 3f0ffa0f069fa24fec27f2b5dae4c88b967a0cddf7985ee6f67c3bcb51f8d3f2
    local_storage_hash: 3f0ffa0f069fa24fec27f2b5dae4c88b967a0cddf7985ee6f67c3bcb51f8d3f2
    repository_seed_hash: aa931fed059bb8ff425b1826456e43d711096d9b5953a8e2d18dda50c15713da
    selected_hash: 3f0ffa0f069fa24fec27f2b5dae4c88b967a0cddf7985ee6f67c3bcb51f8d3f2
    preserved_record_hash: 3f0ffa0f069fa24fec27f2b5dae4c88b967a0cddf7985ee6f67c3bcb51f8d3f2
    generated_markdown_sha256: 4d0d0a73cad83f35e4d012ffb7c1ccae6eea928600428437bc976f2ead011ce9
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-008
    canonical_change_id: LEGACY-QH-cl-20260425-008
    owner_db_hash: b475c0e878841b1be4d5c234071642fb7f849cbc255653f790e19aeae0d00dd5
    local_storage_hash: b475c0e878841b1be4d5c234071642fb7f849cbc255653f790e19aeae0d00dd5
    repository_seed_hash: 4a57c8a8424cd7645319b3b5bdca0adb93fb8fba8070121d443d536d9f3c32db
    selected_hash: b475c0e878841b1be4d5c234071642fb7f849cbc255653f790e19aeae0d00dd5
    preserved_record_hash: b475c0e878841b1be4d5c234071642fb7f849cbc255653f790e19aeae0d00dd5
    generated_markdown_sha256: 5c2d5cb01306b1787bbc06d2f4ba91f8a8b3da37b4e9ee4e05c280186aef7861
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-009
    canonical_change_id: LEGACY-QH-cl-20260425-009
    owner_db_hash: 21ba161ab5ee28c2676ca699b499b251d9b360fc05c11e1403eccd900f751b7e
    local_storage_hash: 21ba161ab5ee28c2676ca699b499b251d9b360fc05c11e1403eccd900f751b7e
    repository_seed_hash: d79ffc8910e52f1fbb7f60bfb9276c8133268f649f738c2bc27d8eacfbcd3d84
    selected_hash: 21ba161ab5ee28c2676ca699b499b251d9b360fc05c11e1403eccd900f751b7e
    preserved_record_hash: 87e5c6f981f346232024e07ce6cecf4b1d8fdcf105302bd5d3c24c159badc300
    generated_markdown_sha256: 3c446966c5a20c35c481414bca2082c47d201e080861b6784f68f35c53fa4104
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[0]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-010
    canonical_change_id: LEGACY-QH-cl-20260425-010
    owner_db_hash: 4daaeb01a3076e8baa9ca39fbda97bbfa6760c18f8ba5656b61d8666539c3a2b
    local_storage_hash: 4daaeb01a3076e8baa9ca39fbda97bbfa6760c18f8ba5656b61d8666539c3a2b
    repository_seed_hash: 128e05afe09bb8176bb83ee70541fa5abe30c87f79fb0a6f4ba3e511c68df219
    selected_hash: 4daaeb01a3076e8baa9ca39fbda97bbfa6760c18f8ba5656b61d8666539c3a2b
    preserved_record_hash: 4daaeb01a3076e8baa9ca39fbda97bbfa6760c18f8ba5656b61d8666539c3a2b
    generated_markdown_sha256: e899517309e59210f06ab57d9e043e8b0de537bea68491cd7413a8cd9cdebb88
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-011
    canonical_change_id: LEGACY-QH-cl-20260425-011
    owner_db_hash: dc0caf57929abec64c4af17dfa3b2df15df5f6069f9b595cd35134841b00499c
    local_storage_hash: dc0caf57929abec64c4af17dfa3b2df15df5f6069f9b595cd35134841b00499c
    repository_seed_hash: 7f1d69240779f5a55a0540b144c2ec70bd2c80e48c3e17e2a42fa2a1190e78b8
    selected_hash: dc0caf57929abec64c4af17dfa3b2df15df5f6069f9b595cd35134841b00499c
    preserved_record_hash: 5e36b4cb8f4f30c0703cc59b042f5f41595c67ef50c7b5b26aa7438067d1b5f3
    generated_markdown_sha256: 62c2975268cd7e05a9df62aa5134297e1d6dfd64d224c06d9f64a611d400678c
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[4]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-012
    canonical_change_id: LEGACY-QH-cl-20260425-012
    owner_db_hash: 669953f5278f1c2f48898205473a0ff218d3c636738e07707b92625b51e93485
    local_storage_hash: 669953f5278f1c2f48898205473a0ff218d3c636738e07707b92625b51e93485
    repository_seed_hash: 3d2bbe88863e6684f9ffbea743c6ec0abee3b2c0d489757b19b8e4274590ece6
    selected_hash: 669953f5278f1c2f48898205473a0ff218d3c636738e07707b92625b51e93485
    preserved_record_hash: bd3c5e7cd23ed571ef3b2d7c2e008fe5c72483d1c5bb892c45229ed8ac69ff82
    generated_markdown_sha256: 0c50c776326afb3f3682f6edfcfcedce7d120baeea749af47e42f0148e018d9b
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[4]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-013
    canonical_change_id: LEGACY-QH-cl-20260425-013
    owner_db_hash: 97965ffb83e09711aed3cc0d7d5d2cfb36a941b5be0fe916c8bdab3a80779b21
    local_storage_hash: 97965ffb83e09711aed3cc0d7d5d2cfb36a941b5be0fe916c8bdab3a80779b21
    repository_seed_hash: 86aa7f0e8189779a2dee70d6a453f7ad1aae46da2a9648601bcd4179ef732427
    selected_hash: 97965ffb83e09711aed3cc0d7d5d2cfb36a941b5be0fe916c8bdab3a80779b21
    preserved_record_hash: ea325b76c14b72c7200eb9120adb726e1545c8b71099b5aaf6a43a928a1f9827
    generated_markdown_sha256: 92d477250758798441aa036541893ab9a6bbcd304a282a6fca87b116d6a7c390
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[3]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-014
    canonical_change_id: LEGACY-QH-cl-20260425-014
    owner_db_hash: e8bc3841d9d15bb20a168b19a419a12402de0ca73bf774bbe364292c799429d9
    local_storage_hash: e8bc3841d9d15bb20a168b19a419a12402de0ca73bf774bbe364292c799429d9
    repository_seed_hash: d8ae7e8357e7a3beb89b132999ae6c4090ee6b5fee0d77f26b051541adf254e3
    selected_hash: e8bc3841d9d15bb20a168b19a419a12402de0ca73bf774bbe364292c799429d9
    preserved_record_hash: 3e3d82121a40e3c7200455b870e4c780af8598b0ed4ad48c2b62f7bf9446d5ca
    generated_markdown_sha256: 0e2b654e4343714b76b37db08b13ad217d607551ee30288aaea26d12ea018e68
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[3]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260425-015
    canonical_change_id: LEGACY-QH-cl-20260425-015
    owner_db_hash: 3f2f5ad41d7148013374c8d9250c61292a135a2fd4b358f18fccf5cdebf306da
    local_storage_hash: 3f2f5ad41d7148013374c8d9250c61292a135a2fd4b358f18fccf5cdebf306da
    repository_seed_hash: 52f2e4900cc5939913ace7284b1c5ff293e0a28f0f57d3c4e872f515a7fa792a
    selected_hash: 3f2f5ad41d7148013374c8d9250c61292a135a2fd4b358f18fccf5cdebf306da
    preserved_record_hash: b7478aadd59c087f01dad5abb71c5ddf0a34393845a9922adfcee13b458d6f30
    generated_markdown_sha256: 1ec7a54052e0d11809865723174765eb43b89d3f82659ed363e73c241ecba615
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[4]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260426-001
    canonical_change_id: LEGACY-QH-cl-20260426-001
    owner_db_hash: f652427887973c0336b98dadf1dc1101af261407a2aa714398669a9274969fb4
    local_storage_hash: f652427887973c0336b98dadf1dc1101af261407a2aa714398669a9274969fb4
    repository_seed_hash: 0f4f1f2c27292c47b9369f006d0b1b72734621f746a7720ad871c1d2112ddc53
    selected_hash: f652427887973c0336b98dadf1dc1101af261407a2aa714398669a9274969fb4
    preserved_record_hash: 90e9ea8a4d481396b5d14f8711316f48a69bf8cf860ac213269abddf30c221f9
    generated_markdown_sha256: f79b62bdf69193a89b78a3e0db96c3cd8200efcbbb4ef68dc8318fc2c940d2af
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[4]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260426-002
    canonical_change_id: LEGACY-QH-cl-20260426-002
    owner_db_hash: da6c130bf1719d1a7dd140ce8862c2da5abcb46d5bc02f088ead4b7eef949f49
    local_storage_hash: da6c130bf1719d1a7dd140ce8862c2da5abcb46d5bc02f088ead4b7eef949f49
    repository_seed_hash: 076e0ceca7a28b3953f3e21f932f72cf6127313458be49f9a9beb83bfe6ee38f
    selected_hash: da6c130bf1719d1a7dd140ce8862c2da5abcb46d5bc02f088ead4b7eef949f49
    preserved_record_hash: da6c130bf1719d1a7dd140ce8862c2da5abcb46d5bc02f088ead4b7eef949f49
    generated_markdown_sha256: bc1aa3a1be23d24b7b0e5de179128691c01c1960b530b5ffb13c85be1f870334
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260426-003
    canonical_change_id: LEGACY-QH-cl-20260426-003
    owner_db_hash: 4eed72337066478b8b32a9b96672ff9761af7a539171167d91a2e2d0df020c7a
    local_storage_hash: 4eed72337066478b8b32a9b96672ff9761af7a539171167d91a2e2d0df020c7a
    repository_seed_hash: 5216b79422594a04fb3193d0624e31685d58e8dee6fa3a65bd671889e8c5cb06
    selected_hash: 4eed72337066478b8b32a9b96672ff9761af7a539171167d91a2e2d0df020c7a
    preserved_record_hash: 4eed72337066478b8b32a9b96672ff9761af7a539171167d91a2e2d0df020c7a
    generated_markdown_sha256: 72ca614bb275149a11a2613f54f3d46f7a4bc966d5d9cc8357e6d5d65125c3bc
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260426-004
    canonical_change_id: LEGACY-QH-cl-20260426-004
    owner_db_hash: a0bef1cc93c182bc586ba063a79fd50d9df933abaf02f5c8b720ac7ade1a56cd
    local_storage_hash: a0bef1cc93c182bc586ba063a79fd50d9df933abaf02f5c8b720ac7ade1a56cd
    repository_seed_hash: 950054e7242b80f266948459ec7381268260203a38883236ed832c7d18419781
    selected_hash: a0bef1cc93c182bc586ba063a79fd50d9df933abaf02f5c8b720ac7ade1a56cd
    preserved_record_hash: e21c809a2abae42636c09ed5ba2d01c72922e539a823f17d8c30d4b0b2711456
    generated_markdown_sha256: bc0d4228c218cc7c8cdcdc09a1b0d5cd94cffb1efdf232b28c1db41ef39838cb
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: filesAffected[5]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260426-005
    canonical_change_id: LEGACY-QH-cl-20260426-005
    owner_db_hash: 7e198bf51c59cbcc9d4354286a11e2c7a910a6eeffc40982bc788487cb3e9cc7
    local_storage_hash: 7e198bf51c59cbcc9d4354286a11e2c7a910a6eeffc40982bc788487cb3e9cc7
    repository_seed_hash: 81a44ae8e7897f7930806db9af1f886215f756f10c242aa3559f37f82226ffc1
    selected_hash: 7e198bf51c59cbcc9d4354286a11e2c7a910a6eeffc40982bc788487cb3e9cc7
    preserved_record_hash: 7e198bf51c59cbcc9d4354286a11e2c7a910a6eeffc40982bc788487cb3e9cc7
    generated_markdown_sha256: adca586191c5189ec621e8f44efc32bcaae1963904deb5c972f2e13ce674f547
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260426-006
    canonical_change_id: LEGACY-QH-cl-20260426-006
    owner_db_hash: e4e74251e121a25c2148b2727cf8f6286023cfefbd0c74d49652d621bf622599
    local_storage_hash: e4e74251e121a25c2148b2727cf8f6286023cfefbd0c74d49652d621bf622599
    repository_seed_hash: 4d4b7a2ece5d3e2473eb7d714078fb5ef22356208e4928959f179f8e26d6337e
    selected_hash: e4e74251e121a25c2148b2727cf8f6286023cfefbd0c74d49652d621bf622599
    preserved_record_hash: e4e74251e121a25c2148b2727cf8f6286023cfefbd0c74d49652d621bf622599
    generated_markdown_sha256: 9e09603744f035b0d30059427e91c442b261d2c94aec6d21ebac5da8489e790a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260430-001
    canonical_change_id: LEGACY-QH-cl-20260430-001
    owner_db_hash: 5e31e4a0e72e5faa1b71c0cc09160d54f7679d8d8bfc066faa418f7800981db3
    local_storage_hash: 5e31e4a0e72e5faa1b71c0cc09160d54f7679d8d8bfc066faa418f7800981db3
    repository_seed_hash: 12115cbb8326e85cd8665b510c93dc09e934a30b533cd7f427eca2f5888f536f
    selected_hash: 5e31e4a0e72e5faa1b71c0cc09160d54f7679d8d8bfc066faa418f7800981db3
    preserved_record_hash: dab796857c4ca0dd361f8de80bac33db8db9598a87d05bb82b273b770190ad3c
    generated_markdown_sha256: 063a7689b246866ad2c13ce7ab21c1cb7fc0cc178a73066953745f16ae9a005d
    source_lineage:
      - owner-db
      - local-storage
    source_difference: reviewed-substantive-collision
    conflict_resolution: selected-reviewed-owner-union-for-substantive-collision
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed contains a substantive same-ID variant across changes, createdAt, filesAffected, plan, problem, relatedRunIds, severity, summary, tags, title, updatedAt. Both variant hashes and the discarded seed-field set remain recorded, and no timestamp-based precedence was used.
    differing_fields:
      - changes
      - createdAt
      - filesAffected
      - plan
      - problem
      - relatedRunIds
      - severity
      - summary
      - tags
      - title
      - updatedAt
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[3]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260430-002
    canonical_change_id: LEGACY-QH-cl-20260430-002
    owner_db_hash: cd1f35e53ac9eb6b593fcd8d16fe972cb43555ef7b7807be29f4a7c14d1899e6
    local_storage_hash: cd1f35e53ac9eb6b593fcd8d16fe972cb43555ef7b7807be29f4a7c14d1899e6
    repository_seed_hash: 83277bcb16cd5591173708d75f911083e4890c4b5d824be7faa797eecb692ab7
    selected_hash: cd1f35e53ac9eb6b593fcd8d16fe972cb43555ef7b7807be29f4a7c14d1899e6
    preserved_record_hash: 91c865de0e071e4d2203f120c6036b90eeb8eb5c76efd424cc8c095bdb0e1a73
    generated_markdown_sha256: a18f61d4d4d50644243e8c8c963a06993a5825963535712a506b17d3add44560
    source_lineage:
      - owner-db
      - local-storage
    source_difference: reviewed-reference-difference
    conflict_resolution: selected-reviewed-owner-union-for-reference-difference
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed differs only in relatedFindingIds, relatedRunIds. All variant hashes and differing fields remain recorded without timestamp-based precedence.
    differing_fields:
      - relatedFindingIds
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[3]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260430-003
    canonical_change_id: LEGACY-QH-cl-20260430-003
    owner_db_hash: 62f42936a16c9658e732783b53a237f0d4b3f42c6ecd21069967a64c16189e4e
    local_storage_hash: 62f42936a16c9658e732783b53a237f0d4b3f42c6ecd21069967a64c16189e4e
    repository_seed_hash: 62f42936a16c9658e732783b53a237f0d4b3f42c6ecd21069967a64c16189e4e
    selected_hash: 62f42936a16c9658e732783b53a237f0d4b3f42c6ecd21069967a64c16189e4e
    preserved_record_hash: 0b33a397b9ee1663b7e9efed905d6ed6cc6e226e1943bd84c0731ab3cc1ee997
    generated_markdown_sha256: 222af4be2fde75793fb39ad32025810d79c376d088d03b3d18d2d14019cb69ce
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[3]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260501-001
    canonical_change_id: LEGACY-QH-cl-20260501-001
    owner_db_hash: a2195cc5685aafc305edcd39a79e28ad34632e95829c6a8d852ffc37a66a3ed8
    local_storage_hash: a2195cc5685aafc305edcd39a79e28ad34632e95829c6a8d852ffc37a66a3ed8
    repository_seed_hash: 6308b2533095416f25b2b2b169a0d485b745dd541b59684d8a93c028edb6d9ea
    selected_hash: a2195cc5685aafc305edcd39a79e28ad34632e95829c6a8d852ffc37a66a3ed8
    preserved_record_hash: 19088d6c4d6522d0a68e2762d48e43555bfeaa88c8d85d8e51b18687d0eccafa
    generated_markdown_sha256: 16562c2623079838b86b7e3d692835dc8c78c3dbdf6895bde7b1f7bb472ca50c
    source_lineage:
      - owner-db
      - local-storage
    source_difference: reviewed-reference-difference
    conflict_resolution: selected-reviewed-owner-union-for-reference-difference
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed differs only in relatedFindingIds, relatedRunIds. All variant hashes and differing fields remain recorded without timestamp-based precedence.
    differing_fields:
      - relatedFindingIds
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[1]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260501-002
    canonical_change_id: LEGACY-QH-cl-20260501-002
    owner_db_hash: b7e50fe062879486221c0b5b33f0f00ff71b57f5d5457ed506c3da614819a4ad
    local_storage_hash: b7e50fe062879486221c0b5b33f0f00ff71b57f5d5457ed506c3da614819a4ad
    repository_seed_hash: 60ecbf43e05954b2d42d63bb68eaec7b977ef866f2a2afe68516d192c29f9acc
    selected_hash: b7e50fe062879486221c0b5b33f0f00ff71b57f5d5457ed506c3da614819a4ad
    preserved_record_hash: 7eb1d4f7d2544af021458a38d4c530632c24a32288e2e4eea2463b4a47d4e7e1
    generated_markdown_sha256: 10412eec30285b49bc96443789ba83991e3fc6069982969b0d7f2110fc321a20
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[4]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260501-003
    canonical_change_id: LEGACY-QH-cl-20260501-003
    owner_db_hash: ee7626051f5277e2deb6af91cbb5f1feed1efbbc42fa42e7f54f7097eda76157
    local_storage_hash: ee7626051f5277e2deb6af91cbb5f1feed1efbbc42fa42e7f54f7097eda76157
    repository_seed_hash: 1fac75f4e78d6a0ba43a340a838190b3612a64f919ec907001e54e8d07031536
    selected_hash: ee7626051f5277e2deb6af91cbb5f1feed1efbbc42fa42e7f54f7097eda76157
    preserved_record_hash: f5b29fab4c23c9457db5acf5aae512587258ec1204f677157426dab8fdbb8ddd
    generated_markdown_sha256: 276086643b0fa7d3ce4e99574eee101c7ebc567b6427a9bbbd786fa6065463a1
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[5]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260501-004
    canonical_change_id: LEGACY-QH-cl-20260501-004
    owner_db_hash: 5cfcf23b123ed784be04a1f146e2bfc7e59141e11afef66cef622677db410865
    local_storage_hash: 5cfcf23b123ed784be04a1f146e2bfc7e59141e11afef66cef622677db410865
    repository_seed_hash: e37125690f08a154044a6384cc3b55aefd762aa4b747bfd9b35290c1735e9996
    selected_hash: 5cfcf23b123ed784be04a1f146e2bfc7e59141e11afef66cef622677db410865
    preserved_record_hash: 7bd261c345147f5b9b695d7ee56245808f3d080a8ad0c949d6d1666023428170
    generated_markdown_sha256: 5875c74871c177705487c8fe8032c2d8fa8a90e570351c94b02041116b4a54f1
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[4]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260501-005
    canonical_change_id: LEGACY-QH-cl-20260501-005
    owner_db_hash: 2c487f51277c504892791c5c9d2c80e94f76d2afb39e80929c2c2f41ee0317fb
    local_storage_hash: 2c487f51277c504892791c5c9d2c80e94f76d2afb39e80929c2c2f41ee0317fb
    repository_seed_hash: 6928076c6547e5862e632329c8433923815c4bfb27a0e60d74a6f28bcb8eaae0
    selected_hash: 2c487f51277c504892791c5c9d2c80e94f76d2afb39e80929c2c2f41ee0317fb
    preserved_record_hash: 51269603cbe76f0dcc2354d248371096805ee03d7aa2b9f7af8bfa863eb31e56
    generated_markdown_sha256: e2f480c84e1face4f63e4cb174253eba04e5ce5663a4ee36b066f9fdcd3ba2c2
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[3]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260501-006
    canonical_change_id: LEGACY-QH-cl-20260501-006
    owner_db_hash: e5789fc9830ff3130873e1d7acb830c545d9832eb6400435e71045fbdf3027fc
    local_storage_hash: e5789fc9830ff3130873e1d7acb830c545d9832eb6400435e71045fbdf3027fc
    repository_seed_hash: 03eb3eed314158f684dde5124b79fcbc020c98fdea9b26e8777d05a36bf5743f
    selected_hash: e5789fc9830ff3130873e1d7acb830c545d9832eb6400435e71045fbdf3027fc
    preserved_record_hash: d994ac7946072eb10ca9fe9c386d0ad704a59f12b295ca9e1bafcc54da3ee69d
    generated_markdown_sha256: 2422a1ec14f74cc60465d883db2c855f61205ff2bcb15d75112dd3a951a5f122
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[4]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260502-001
    canonical_change_id: LEGACY-QH-cl-20260502-001
    owner_db_hash: f4b1365137e583ec8dbbd094ca35d312a9049d788e1ad262d0c2b20268ae5b0b
    local_storage_hash: f4b1365137e583ec8dbbd094ca35d312a9049d788e1ad262d0c2b20268ae5b0b
    repository_seed_hash: 4790e46d82a899951345eb3ded4e4679ce545e3a50906bb437abdafb06fe8318
    selected_hash: f4b1365137e583ec8dbbd094ca35d312a9049d788e1ad262d0c2b20268ae5b0b
    preserved_record_hash: f4b1365137e583ec8dbbd094ca35d312a9049d788e1ad262d0c2b20268ae5b0b
    generated_markdown_sha256: 84a43a758050ba749e58884330969176fd6088233154c17b928eb9f30cf6d932
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260506-001
    canonical_change_id: LEGACY-QH-cl-20260506-001
    owner_db_hash: 53beb25304c1eafb1846bfd348b44b0ab7fc4ba296961d1a19665704bf818cc0
    local_storage_hash: 53beb25304c1eafb1846bfd348b44b0ab7fc4ba296961d1a19665704bf818cc0
    repository_seed_hash: 11d0df88d177453093372702db51f32bf968d6a9128ef03520fbfdf414aead05
    selected_hash: 53beb25304c1eafb1846bfd348b44b0ab7fc4ba296961d1a19665704bf818cc0
    preserved_record_hash: 53beb25304c1eafb1846bfd348b44b0ab7fc4ba296961d1a19665704bf818cc0
    generated_markdown_sha256: a2ebf627fc7edd8c54cf2516e300a2c9213096211f9fafe7bd3dbd8a18c3772a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260507-001
    canonical_change_id: LEGACY-QH-cl-20260507-001
    owner_db_hash: 97bc835a375be42ca36a966490e4bef808c052216a7ee86f69055f3ddd43f73c
    local_storage_hash: 97bc835a375be42ca36a966490e4bef808c052216a7ee86f69055f3ddd43f73c
    repository_seed_hash: b3c89be81bf437d4da62d271c1a9bb4410d4de0df28337674f82d385588d8bd4
    selected_hash: 97bc835a375be42ca36a966490e4bef808c052216a7ee86f69055f3ddd43f73c
    preserved_record_hash: 97bc835a375be42ca36a966490e4bef808c052216a7ee86f69055f3ddd43f73c
    generated_markdown_sha256: 142e845615425a0f792a33c90153c9bbe0eea61ca03c16507e278afc1fe3d941
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260509-001
    canonical_change_id: LEGACY-QH-cl-20260509-001
    owner_db_hash: 75fbb6a3eb0a82b3c3d18304533c1ecf1ef82d4467afbc800aad60f8441530df
    local_storage_hash: 75fbb6a3eb0a82b3c3d18304533c1ecf1ef82d4467afbc800aad60f8441530df
    repository_seed_hash: 72c6e21ee9dab6b53518aeeb236cfd275e49ccc96cc0cfe69d8b773b43acbfc7
    selected_hash: 75fbb6a3eb0a82b3c3d18304533c1ecf1ef82d4467afbc800aad60f8441530df
    preserved_record_hash: 75fbb6a3eb0a82b3c3d18304533c1ecf1ef82d4467afbc800aad60f8441530df
    generated_markdown_sha256: bd58ec5c275afc0f7a20c7766c842780ca9a11b0ca340f5a02f0abb5f99d27d3
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260509-002
    canonical_change_id: LEGACY-QH-cl-20260509-002
    owner_db_hash: 5cf28d896cbcba4f1d1462a249e8e891ab380fb0a1187eb57895e7e27e1566f9
    local_storage_hash: 5cf28d896cbcba4f1d1462a249e8e891ab380fb0a1187eb57895e7e27e1566f9
    repository_seed_hash: ee0b47cfa041ec0c2c8c6401ccf597dca8dc96bed6d154c5956f873d74f2f09c
    selected_hash: 5cf28d896cbcba4f1d1462a249e8e891ab380fb0a1187eb57895e7e27e1566f9
    preserved_record_hash: 5cf28d896cbcba4f1d1462a249e8e891ab380fb0a1187eb57895e7e27e1566f9
    generated_markdown_sha256: 70e07c83f54cd70b2d35e98840d73b5074e5e6cbf69a0c3a3beb6cb41c87f4e0
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260509-003
    canonical_change_id: LEGACY-QH-cl-20260509-003
    owner_db_hash: 0bcb603f93294938880b94075270000874b531572252629ed1c1338b2a05043f
    local_storage_hash: 0bcb603f93294938880b94075270000874b531572252629ed1c1338b2a05043f
    repository_seed_hash: 26823f0a83cb22e0d25ff68f10b41bb940d596619392f9b161c8b47cf41db4bf
    selected_hash: 0bcb603f93294938880b94075270000874b531572252629ed1c1338b2a05043f
    preserved_record_hash: 0bcb603f93294938880b94075270000874b531572252629ed1c1338b2a05043f
    generated_markdown_sha256: 770f979abe1c0bfefc784c64bf2a992951959427f009174d24c0a8e4e963d9af
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260510-001
    canonical_change_id: LEGACY-QH-cl-20260510-001
    owner_db_hash: 39a146e4634157a2c5a514d16b6670d889b439f3bd83a2f1a8ba86cbf2d31d6c
    local_storage_hash: 39a146e4634157a2c5a514d16b6670d889b439f3bd83a2f1a8ba86cbf2d31d6c
    repository_seed_hash: 8a371b08554f3720b4522cc4b2f166715068148d4eee9d9f7b7578b450f8d390
    selected_hash: 39a146e4634157a2c5a514d16b6670d889b439f3bd83a2f1a8ba86cbf2d31d6c
    preserved_record_hash: 39a146e4634157a2c5a514d16b6670d889b439f3bd83a2f1a8ba86cbf2d31d6c
    generated_markdown_sha256: f602a2cf93f01c237013ae26e92194fa427b860b989440ee5d2f940714c33c59
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260510-002
    canonical_change_id: LEGACY-QH-cl-20260510-002
    owner_db_hash: 974aa568a5df203c179ba119b5158332c41e060fb3603299748a9cce38a8f58c
    local_storage_hash: 974aa568a5df203c179ba119b5158332c41e060fb3603299748a9cce38a8f58c
    repository_seed_hash: d0f52381459950a431a8369a74e3852354d8c7e6de798f4aa7782fb89f067577
    selected_hash: 974aa568a5df203c179ba119b5158332c41e060fb3603299748a9cce38a8f58c
    preserved_record_hash: 974aa568a5df203c179ba119b5158332c41e060fb3603299748a9cce38a8f58c
    generated_markdown_sha256: e0f6af02da1fddc8c0e475d088d583179fef038c146119189f9919c44331f8bc
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260514-001
    canonical_change_id: LEGACY-QH-cl-20260514-001
    owner_db_hash: 90d3aba8c8315f679c7cb0808c1cdf16b9a38ff37f16f2388ad5049b00a851fc
    local_storage_hash: 90d3aba8c8315f679c7cb0808c1cdf16b9a38ff37f16f2388ad5049b00a851fc
    repository_seed_hash: 31593814dc131b7f0e24b6e365d25943765fa4e91f885a6fc890cb6b3faa3798
    selected_hash: 90d3aba8c8315f679c7cb0808c1cdf16b9a38ff37f16f2388ad5049b00a851fc
    preserved_record_hash: 90d3aba8c8315f679c7cb0808c1cdf16b9a38ff37f16f2388ad5049b00a851fc
    generated_markdown_sha256: eb630ea2e502381da838b3264fa3aeeb4e0806e4f383a0b194882277bbc92e78
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260514-002
    canonical_change_id: LEGACY-QH-cl-20260514-002
    owner_db_hash: f296054986097ca12f40cee8a1908d50a715d6191b2803b785eadadf40e1f68c
    local_storage_hash: f296054986097ca12f40cee8a1908d50a715d6191b2803b785eadadf40e1f68c
    repository_seed_hash: 838a3ae095e1c5eeb210b443973a6426d08eb962a726e337808c560f6e1b6559
    selected_hash: f296054986097ca12f40cee8a1908d50a715d6191b2803b785eadadf40e1f68c
    preserved_record_hash: f296054986097ca12f40cee8a1908d50a715d6191b2803b785eadadf40e1f68c
    generated_markdown_sha256: 26732483341ba64e8f70fe940b66b457befb4d8dbd7408afc53d4baf3108e00b
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260515-001
    canonical_change_id: LEGACY-QH-cl-20260515-001
    owner_db_hash: ee838df5ab4875f923e471d287df6f79c872a5443924101df3c6b84453eb8054
    local_storage_hash: ee838df5ab4875f923e471d287df6f79c872a5443924101df3c6b84453eb8054
    repository_seed_hash: c2656451b2a9fd401e23e4b3fd6cb2d0cdebb19d7aaecfb5688e3eb403980c21
    selected_hash: ee838df5ab4875f923e471d287df6f79c872a5443924101df3c6b84453eb8054
    preserved_record_hash: ee838df5ab4875f923e471d287df6f79c872a5443924101df3c6b84453eb8054
    generated_markdown_sha256: f839520bd18e0b5c642c0a6723c5313386be42ec1b2bfd77670eafddd53155bc
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260516-001
    canonical_change_id: LEGACY-QH-cl-20260516-001
    owner_db_hash: c6d0a03157e4ea6dfa055724d6dfdbdd451f3ea5f1127000c8a4211444332864
    local_storage_hash: c6d0a03157e4ea6dfa055724d6dfdbdd451f3ea5f1127000c8a4211444332864
    repository_seed_hash: 94f1b4855c484821555e7ff058c7847f4f940864e543c06cfc02d54cedca00f7
    selected_hash: c6d0a03157e4ea6dfa055724d6dfdbdd451f3ea5f1127000c8a4211444332864
    preserved_record_hash: c6d0a03157e4ea6dfa055724d6dfdbdd451f3ea5f1127000c8a4211444332864
    generated_markdown_sha256: 730cd695bc4c6b433732ac0d9bfda74852c2fe064e81b1f702126ec574395450
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260516-002
    canonical_change_id: LEGACY-QH-cl-20260516-002
    owner_db_hash: 3bbc7085e1794fb3366a2e971fd81021cc49a78a7256a240554f1b64b9106794
    local_storage_hash: 3bbc7085e1794fb3366a2e971fd81021cc49a78a7256a240554f1b64b9106794
    repository_seed_hash: 08023c017abde606f90db9d408dfbde55515141836186170378c99174182ff04
    selected_hash: 3bbc7085e1794fb3366a2e971fd81021cc49a78a7256a240554f1b64b9106794
    preserved_record_hash: 3bbc7085e1794fb3366a2e971fd81021cc49a78a7256a240554f1b64b9106794
    generated_markdown_sha256: 63d2062c63eb132778a75e9c9d2124df9e6a5b815e997dbfecb1a0a99726c9a9
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260516-003
    canonical_change_id: LEGACY-QH-cl-20260516-003
    owner_db_hash: 78232fa9d569b16074f735386cc045ab3a2c5d2e60f3ae1fa244e71e8ee6a0fc
    local_storage_hash: 78232fa9d569b16074f735386cc045ab3a2c5d2e60f3ae1fa244e71e8ee6a0fc
    repository_seed_hash: 4cebfafeec9a366f5bf6461b45b689b5681ef4998d6faf28a296327b4fd9697d
    selected_hash: 78232fa9d569b16074f735386cc045ab3a2c5d2e60f3ae1fa244e71e8ee6a0fc
    preserved_record_hash: 78232fa9d569b16074f735386cc045ab3a2c5d2e60f3ae1fa244e71e8ee6a0fc
    generated_markdown_sha256: 3423937aca200d52eac8c5d34672cc5d2ebcc6c45fc5d15348ccf301c5e86dff
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260516-004
    canonical_change_id: LEGACY-QH-cl-20260516-004
    owner_db_hash: 8b1920a12cbe2d3fb62f5800410c4fb2e7205a8d5b828d1a892c4e88aeaa7efa
    local_storage_hash: 8b1920a12cbe2d3fb62f5800410c4fb2e7205a8d5b828d1a892c4e88aeaa7efa
    repository_seed_hash: 029c0b211626582ee6ff77aaabec7053f4d07f76f12e05643f0972b794f0db90
    selected_hash: 8b1920a12cbe2d3fb62f5800410c4fb2e7205a8d5b828d1a892c4e88aeaa7efa
    preserved_record_hash: 7464cad056bc185629b8cb1f59e30223535bdd0fb02e810e319dcb05bfe16365
    generated_markdown_sha256: c29cf534d01de67e1268c57502a9f4eb5e4f6ad3d3bbb052ce8915b1b136b02f
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions:
      - field: changes
        transformation: home-directory-prefix-to-$HOME
      - field: filesAffected[2]
        transformation: home-directory-prefix-to-$HOME
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260517-001
    canonical_change_id: LEGACY-QH-cl-20260517-001
    owner_db_hash: b9d65c73013d9ffa0c326089dcf5d1610f2392e225edf6294304af1c7ff9ff64
    local_storage_hash: b9d65c73013d9ffa0c326089dcf5d1610f2392e225edf6294304af1c7ff9ff64
    repository_seed_hash: 94e231fdf0350dace000c26d3db592a9553ff1dfa34957c3d7d11487742db2c3
    selected_hash: b9d65c73013d9ffa0c326089dcf5d1610f2392e225edf6294304af1c7ff9ff64
    preserved_record_hash: b9d65c73013d9ffa0c326089dcf5d1610f2392e225edf6294304af1c7ff9ff64
    generated_markdown_sha256: 93fdf2e748ed69755e85422cc9e03caa75b42dc7af9e9e997ab6a35b3cc524c8
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260520-001
    canonical_change_id: LEGACY-QH-cl-20260520-001
    owner_db_hash: 971ceaea834907fbacbf4fe99364688670845b949b2b7f0733e39eee79814dd4
    local_storage_hash: 971ceaea834907fbacbf4fe99364688670845b949b2b7f0733e39eee79814dd4
    repository_seed_hash: 0dd39efe1732597ac7e2f2caf1fff69669a50b32b2cb6306577862abe79cc7c4
    selected_hash: 971ceaea834907fbacbf4fe99364688670845b949b2b7f0733e39eee79814dd4
    preserved_record_hash: 971ceaea834907fbacbf4fe99364688670845b949b2b7f0733e39eee79814dd4
    generated_markdown_sha256: 8659a4933601fc67633f03c86d84230c0c585709b42205526abd14cc6c483a01
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260521-001
    canonical_change_id: LEGACY-QH-cl-20260521-001
    owner_db_hash: bb760ea0a007f1244c9611ddc4c7cdfda80ce5bf6799c73f8b6912b888029dfd
    local_storage_hash: bb760ea0a007f1244c9611ddc4c7cdfda80ce5bf6799c73f8b6912b888029dfd
    repository_seed_hash: a1cae7f32e0d99b17b6aa8c564c9ac1b26c2ca49279d45766e5e5de1aca9eec8
    selected_hash: bb760ea0a007f1244c9611ddc4c7cdfda80ce5bf6799c73f8b6912b888029dfd
    preserved_record_hash: bb760ea0a007f1244c9611ddc4c7cdfda80ce5bf6799c73f8b6912b888029dfd
    generated_markdown_sha256: 0f8cee6d599602e703f329d046f2d167d760dc59d19c8d73be6be71a4a52c09a
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260521-002
    canonical_change_id: LEGACY-QH-cl-20260521-002
    owner_db_hash: 087e6d494637fd8a3713a4d43f63d11ec0d25f6a059874d40e7d44ab620d2d46
    local_storage_hash: 087e6d494637fd8a3713a4d43f63d11ec0d25f6a059874d40e7d44ab620d2d46
    repository_seed_hash: 1f2c2aa7b0a43127597e8c99a76adec9d066f0aa84b77df8cf2d255bb9bf2cc4
    selected_hash: 087e6d494637fd8a3713a4d43f63d11ec0d25f6a059874d40e7d44ab620d2d46
    preserved_record_hash: 087e6d494637fd8a3713a4d43f63d11ec0d25f6a059874d40e7d44ab620d2d46
    generated_markdown_sha256: 214be5b78818663ffea2a7bb0641d47952f5578d85d81a821789869a93f641c8
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260521-003
    canonical_change_id: LEGACY-QH-cl-20260521-003
    owner_db_hash: 7e09448efaaf74ed6d2fa9c773380826cd6762e5af2517d7963a44a22048bccd
    local_storage_hash: 7e09448efaaf74ed6d2fa9c773380826cd6762e5af2517d7963a44a22048bccd
    repository_seed_hash: 4996e06bdf260fe9f106c9881b74b113c8790b2700099a4ba579a8f1f1f5875a
    selected_hash: 7e09448efaaf74ed6d2fa9c773380826cd6762e5af2517d7963a44a22048bccd
    preserved_record_hash: 7e09448efaaf74ed6d2fa9c773380826cd6762e5af2517d7963a44a22048bccd
    generated_markdown_sha256: 27e89ed2a47e3793a20687ee1d1c9f871a76e70a0e15afa7ade011836f823780
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260523-001
    canonical_change_id: LEGACY-QH-cl-20260523-001
    owner_db_hash: f4dd1b064a861005992d243bc320d4f0af0d87e1ba6ce41a0f4c89731934bf85
    local_storage_hash: f4dd1b064a861005992d243bc320d4f0af0d87e1ba6ce41a0f4c89731934bf85
    repository_seed_hash: e4ba5da38b9d0010a9993088f7c1a5176bd117ccc7796bc715498a768ad585d2
    selected_hash: f4dd1b064a861005992d243bc320d4f0af0d87e1ba6ce41a0f4c89731934bf85
    preserved_record_hash: f4dd1b064a861005992d243bc320d4f0af0d87e1ba6ce41a0f4c89731934bf85
    generated_markdown_sha256: a6457571303014b5e65acf8c83125b938d4f55a735d1350968a7d904dfbd891e
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260523-002
    canonical_change_id: LEGACY-QH-cl-20260523-002
    owner_db_hash: 0bce0d1fb41993adb62f67748fb70ce41afb0ba3f1100939d6e2f5f9a823dc4b
    local_storage_hash: 0bce0d1fb41993adb62f67748fb70ce41afb0ba3f1100939d6e2f5f9a823dc4b
    repository_seed_hash: d8169a597398d0d0c36052de90330f33e53f8f13c93389f2fa27f6e06b6fa1d3
    selected_hash: 0bce0d1fb41993adb62f67748fb70ce41afb0ba3f1100939d6e2f5f9a823dc4b
    preserved_record_hash: 0bce0d1fb41993adb62f67748fb70ce41afb0ba3f1100939d6e2f5f9a823dc4b
    generated_markdown_sha256: dfc4c7f8d83303efea1650a0781ced403da1d42dbfccb5903a52ace29a237f8b
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260524-001
    canonical_change_id: LEGACY-QH-cl-20260524-001
    owner_db_hash: 8a4c4b547b8dd9ce3ad601f96fdfc8f66888edfc22941193531663d5a17040d6
    local_storage_hash: 8a4c4b547b8dd9ce3ad601f96fdfc8f66888edfc22941193531663d5a17040d6
    repository_seed_hash: d0b161dd24130cf8fc3b5efe7d8cbac04a5ae1e7c1bcd951ee4398fcfb556ab6
    selected_hash: 8a4c4b547b8dd9ce3ad601f96fdfc8f66888edfc22941193531663d5a17040d6
    preserved_record_hash: 8a4c4b547b8dd9ce3ad601f96fdfc8f66888edfc22941193531663d5a17040d6
    generated_markdown_sha256: d88a476ef34ad1040fd7781f386534c4c553bd0a9b0c8bbf808321e849bb2b6f
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260528-001
    canonical_change_id: LEGACY-QH-cl-20260528-001
    owner_db_hash: 6f869641ee6317bea6443998bcae7bed3db63ce5872b6e917edf1eea460d957d
    local_storage_hash: 6f869641ee6317bea6443998bcae7bed3db63ce5872b6e917edf1eea460d957d
    repository_seed_hash: dc607e94aed3e316ce201711c120c982c28715092f0c95465032be2a5a5e3449
    selected_hash: 6f869641ee6317bea6443998bcae7bed3db63ce5872b6e917edf1eea460d957d
    preserved_record_hash: 6f869641ee6317bea6443998bcae7bed3db63ce5872b6e917edf1eea460d957d
    generated_markdown_sha256: 6d0deab38d663d8d2d87e9843634d37703aab68e7001af252c68d86c31aa614d
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260529-001
    canonical_change_id: LEGACY-QH-cl-20260529-001
    owner_db_hash: e8684f78dd402a92ee6656784556c0391c226775e7fbe896fa4fcfa6cc8d9cec
    local_storage_hash: e8684f78dd402a92ee6656784556c0391c226775e7fbe896fa4fcfa6cc8d9cec
    repository_seed_hash: f9a5e2c883b87ffa675d5e38fbcc9c6421f37da5adf63afdf317e6165532da4b
    selected_hash: e8684f78dd402a92ee6656784556c0391c226775e7fbe896fa4fcfa6cc8d9cec
    preserved_record_hash: e8684f78dd402a92ee6656784556c0391c226775e7fbe896fa4fcfa6cc8d9cec
    generated_markdown_sha256: 074aaafb00af161e9cbc860b6cd300eedcda43f1a3a95f875c198f705e899671
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260529-002
    canonical_change_id: LEGACY-QH-cl-20260529-002
    owner_db_hash: ebbb5e0967d7aad8a303ffa8913331179576a5df7045d08ff36ecb659ae51e9f
    local_storage_hash: ebbb5e0967d7aad8a303ffa8913331179576a5df7045d08ff36ecb659ae51e9f
    repository_seed_hash: 5dac244c77fb1a9f0febd2c12e0ab4f16a02cb89529029490a2cb52f5f188a79
    selected_hash: ebbb5e0967d7aad8a303ffa8913331179576a5df7045d08ff36ecb659ae51e9f
    preserved_record_hash: ebbb5e0967d7aad8a303ffa8913331179576a5df7045d08ff36ecb659ae51e9f
    generated_markdown_sha256: 455509b2fb93a24417f538e5fcdd65b94e3fa3d1f441c1fd62a18c9753113bed
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260529-003
    canonical_change_id: LEGACY-QH-cl-20260529-003
    owner_db_hash: 0decf027a756b2089ad20d75265e37b5f7c51992763b6feb753a6fdb0621d126
    local_storage_hash: 0decf027a756b2089ad20d75265e37b5f7c51992763b6feb753a6fdb0621d126
    repository_seed_hash: fff265183ea9981542d4a16d0f6a11fdcf090a99fb068b20c18e0d6fab950f7e
    selected_hash: 0decf027a756b2089ad20d75265e37b5f7c51992763b6feb753a6fdb0621d126
    preserved_record_hash: 0decf027a756b2089ad20d75265e37b5f7c51992763b6feb753a6fdb0621d126
    generated_markdown_sha256: d117031162acc464c7137940ac117f3def1b4483078f25ee3b8d704564fcd966
    source_lineage:
      - owner-db
      - local-storage
    source_difference: normalized-empty-optional-field
    conflict_resolution: normalized-optional-empty-array-under-reviewed-owner-union
    source_resolution_rationale: CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage.
    differing_fields:
      - relatedRunIds
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260530-001
    canonical_change_id: LEGACY-QH-cl-20260530-001
    owner_db_hash: fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2
    local_storage_hash: fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2
    repository_seed_hash: fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2
    selected_hash: fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2
    preserved_record_hash: fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2
    generated_markdown_sha256: e1de31d447d3dbae551d0b5892946483a0f8bd3a8fc8bce7c8224ea34e266d43
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260607-001
    canonical_change_id: LEGACY-QH-cl-20260607-001
    owner_db_hash: b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d
    local_storage_hash: b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d
    repository_seed_hash: b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d
    selected_hash: b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d
    preserved_record_hash: b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d
    generated_markdown_sha256: 7850369c5e7e7e5c826c3b9b7430be260381a5ff69d1322128ce64bae4c34405
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260607-002
    canonical_change_id: LEGACY-QH-cl-20260607-002
    owner_db_hash: e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450
    local_storage_hash: e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450
    repository_seed_hash: e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450
    selected_hash: e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450
    preserved_record_hash: e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450
    generated_markdown_sha256: 4c498656826d2d5a20e572526c6554c3f2b7d34773c0d71e176b6ec8006c078d
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260607-003
    canonical_change_id: LEGACY-QH-cl-20260607-003
    owner_db_hash: 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27
    local_storage_hash: 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27
    repository_seed_hash: 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27
    selected_hash: 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27
    preserved_record_hash: 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27
    generated_markdown_sha256: 4a06978536ab294b8b885556423596d82e02539fc9473159c76c1c70e0489cb4
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260607-004
    canonical_change_id: LEGACY-QH-cl-20260607-004
    owner_db_hash: 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80
    local_storage_hash: 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80
    repository_seed_hash: 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80
    selected_hash: 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80
    preserved_record_hash: 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80
    generated_markdown_sha256: fa91fa4ce114ab03bca844049a7fd233d3add7546e5f389da6534a81b3fa2113
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-001
    canonical_change_id: LEGACY-QH-cl-20260613-001
    owner_db_hash: bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb
    local_storage_hash: bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb
    repository_seed_hash: bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb
    selected_hash: bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb
    preserved_record_hash: bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb
    generated_markdown_sha256: e953fff84df53c921de21fded6d12c49d9bff229fd7969715abc65bdf2c8983b
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-002
    canonical_change_id: LEGACY-QH-cl-20260613-002
    owner_db_hash: f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4
    local_storage_hash: f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4
    repository_seed_hash: f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4
    selected_hash: f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4
    preserved_record_hash: f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4
    generated_markdown_sha256: af555bcc0c03605e181ef5f7d272c750c39c691e97b5c9eb1eaa2c658d3d51ae
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-003
    canonical_change_id: LEGACY-QH-cl-20260613-003
    owner_db_hash: 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6
    local_storage_hash: 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6
    repository_seed_hash: 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6
    selected_hash: 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6
    preserved_record_hash: 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6
    generated_markdown_sha256: 236c71af5ea374aad74629c43752932567b72554890798aaf3eb8f4fda91da99
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes ReviewModal failure logging for the review workflow launched from Community Gallery story details.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-004
    canonical_change_id: LEGACY-QH-cl-20260613-004
    owner_db_hash: 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22
    local_storage_hash: 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22
    repository_seed_hash: 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22
    selected_hash: 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22
    preserved_record_hash: 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22
    generated_markdown_sha256: 8540b912af7d097e7002d98b824cff71a1434581d514c6419224541a09849a89
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-005
    canonical_change_id: LEGACY-QH-cl-20260613-005
    owner_db_hash: 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d
    local_storage_hash: 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d
    repository_seed_hash: 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d
    selected_hash: 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d
    preserved_record_hash: 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d
    generated_markdown_sha256: e7ad1cb3d014de851abe0a43c7c480af697159a765f7472e82ad6d719bb1d715
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-006
    canonical_change_id: LEGACY-QH-cl-20260613-006
    owner_db_hash: e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501
    local_storage_hash: e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501
    repository_seed_hash: e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501
    selected_hash: e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501
    preserved_record_hash: e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501
    generated_markdown_sha256: 4422b4b36aff402ef41f9009706705c05e0aee34b4060ef302b5d7c61f3056cf
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-007
    canonical_change_id: LEGACY-QH-cl-20260613-007
    owner_db_hash: 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4
    local_storage_hash: 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4
    repository_seed_hash: 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4
    selected_hash: 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4
    preserved_record_hash: 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4
    generated_markdown_sha256: 7984fe655e8e6e7e888eac6b8f31f18c4aa53b28bbcedd9994bdc440d0996575
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-008
    canonical_change_id: LEGACY-QH-cl-20260613-008
    owner_db_hash: 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e
    local_storage_hash: 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e
    repository_seed_hash: 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e
    selected_hash: 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e
    preserved_record_hash: 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e
    generated_markdown_sha256: 0dbb354d6ca3a7192a351ef26d15a9125b2470dba838fb8f429c987d97d58d4a
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-009
    canonical_change_id: LEGACY-QH-cl-20260613-009
    owner_db_hash: a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1
    local_storage_hash: a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1
    repository_seed_hash: a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1
    selected_hash: a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1
    preserved_record_hash: a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1
    generated_markdown_sha256: 1f2d3d764e65ff42d0360523dbbc9c1e1ee3e881ff16d58861f21838826ae247
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-010
    canonical_change_id: LEGACY-QH-cl-20260613-010
    owner_db_hash: 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85
    local_storage_hash: 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85
    repository_seed_hash: 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85
    selected_hash: 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85
    preserved_record_hash: 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85
    generated_markdown_sha256: 8f461de308fa877cfe47b819f5a146a2550d04b9e757274ff6ce223ea2bc760c
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-011
    canonical_change_id: LEGACY-QH-cl-20260613-011
    owner_db_hash: f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a
    local_storage_hash: f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a
    repository_seed_hash: f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a
    selected_hash: f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a
    preserved_record_hash: f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a
    generated_markdown_sha256: e711906b804bd2f447a80164c08983e845c82e4f12254c58ce457f217fa4902f
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-012
    canonical_change_id: LEGACY-QH-cl-20260613-012
    owner_db_hash: cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb
    local_storage_hash: cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb
    repository_seed_hash: cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb
    selected_hash: cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb
    preserved_record_hash: cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb
    generated_markdown_sha256: 5bb6dbfff24824d5cb16e4c1ebbca2ce0afae4e7b4994f1657709a698f26c41e
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-013
    canonical_change_id: LEGACY-QH-cl-20260613-013
    owner_db_hash: 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540
    local_storage_hash: 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540
    repository_seed_hash: 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540
    selected_hash: 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540
    preserved_record_hash: 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540
    generated_markdown_sha256: 5fc68e12e7722bd77e296aea22265885384f638a1c7a64e7f6afc6b2486d0f07
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260613-014
    canonical_change_id: LEGACY-QH-cl-20260613-014
    owner_db_hash: 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b
    local_storage_hash: 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b
    repository_seed_hash: 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b
    selected_hash: 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b
    preserved_record_hash: 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b
    generated_markdown_sha256: 912d6e76cb4f77a6403d03c50526f5e697a6cf5b00e7d330432378a56df8210d
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260614-001
    canonical_change_id: LEGACY-QH-cl-20260614-001
    owner_db_hash: fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121
    local_storage_hash: fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121
    repository_seed_hash: fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121
    selected_hash: fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121
    preserved_record_hash: fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121
    generated_markdown_sha256: 02892a74c938ac372d27f4ed605a4df346e1aaf0b63ce2764cc9719bc06bbb1d
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260614-002
    canonical_change_id: LEGACY-QH-cl-20260614-002
    owner_db_hash: 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9
    local_storage_hash: 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9
    repository_seed_hash: 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9
    selected_hash: 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9
    preserved_record_hash: 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9
    generated_markdown_sha256: ee721b5b6f64cbe7c70de2b233164956e6d4878379332637d3d8d8cf4c572a8a
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260614-003
    canonical_change_id: LEGACY-QH-cl-20260614-003
    owner_db_hash: f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180
    local_storage_hash: f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180
    repository_seed_hash: f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180
    selected_hash: f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180
    preserved_record_hash: f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180
    generated_markdown_sha256: 26e40dd2aabf1711925142ee71060ef1eb5ca089f0ea9e6476403df4d18f15a4
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes ownership enforcement for published_scenarios, the durable publication rows consumed by Community Gallery.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260614-004
    canonical_change_id: LEGACY-QH-cl-20260614-004
    owner_db_hash: 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a
    local_storage_hash: 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a
    repository_seed_hash: 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a
    selected_hash: 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a
    preserved_record_hash: 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a
    generated_markdown_sha256: 32b74deaa3d96a1897068257006d9b2e820f1374c156d65042b1c14ddf6e275f
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes Community Gallery like, save, and play counters and their backing ledger and trigger behavior.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260614-005
    canonical_change_id: LEGACY-QH-cl-20260614-005
    owner_db_hash: fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90
    local_storage_hash: fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90
    repository_seed_hash: fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90
    selected_hash: fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90
    preserved_record_hash: fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90
    generated_markdown_sha256: 0087d8e8baa2ab777d42b717ce09719d3a0dd1e31defc1d139f61c5d38352a32
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes the Gallery RPC and published-work privacy rules that determine which creator stories Community Gallery may expose.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260614-006
    canonical_change_id: LEGACY-QH-cl-20260614-006
    owner_db_hash: eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026
    local_storage_hash: eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026
    repository_seed_hash: eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026
    selected_hash: eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026
    preserved_record_hash: eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026
    generated_markdown_sha256: 27c1d4b61aae4cb434caa64191f30ff3cf1ccbd0ba4877f0990bf671ee152d84
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260614-007
    canonical_change_id: LEGACY-QH-cl-20260614-007
    owner_db_hash: 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be
    local_storage_hash: 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be
    repository_seed_hash: 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be
    selected_hash: 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be
    preserved_record_hash: 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be
    generated_markdown_sha256: f954fe0bcaa138388bb813ac028dc7142d777b902e19d959ef40976ca1f6fe3e
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: not_applicable
    affected_capabilities: []
    rationale: The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260619-001
    canonical_change_id: LEGACY-QH-cl-20260619-001
    owner_db_hash: 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289
    local_storage_hash: 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289
    repository_seed_hash: 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289
    selected_hash: 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289
    preserved_record_hash: 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289
    generated_markdown_sha256: 735609feccb425d3b3e920eee0b598bedc2a0a476e8167b79cd033429c59c46f
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes Gallery likes, view and play guards, published-story visibility, and shared Gallery request paths.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260619-002
    canonical_change_id: LEGACY-QH-cl-20260619-002
    owner_db_hash: 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35
    local_storage_hash: 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35
    repository_seed_hash: 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35
    selected_hash: 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35
    preserved_record_hash: 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35
    generated_markdown_sha256: a51a9ee0bc50fa8e7c8d14e6075b3dcbee20648a1f2eec619a8ad19b8e9e94bd
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes public scenario-review reads and the Story Detail review surface opened from Community Gallery.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260619-003
    canonical_change_id: LEGACY-QH-cl-20260619-003
    owner_db_hash: 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92
    local_storage_hash: 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92
    repository_seed_hash: 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92
    selected_hash: 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92
    preserved_record_hash: 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92
    generated_markdown_sha256: c2b4adc1a15a8fc893250c4b7cfe8147a455fa386e4f29cf8606be8b19f53e4c
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes published-scenario access and the Gallery data service used by saved and published story surfaces.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
  - legacy_source_id: cl-20260620-001
    canonical_change_id: LEGACY-QH-cl-20260620-001
    owner_db_hash: fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c
    local_storage_hash: fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c
    repository_seed_hash: fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c
    selected_hash: fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c
    preserved_record_hash: fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c
    generated_markdown_sha256: ef203c85b30cfdc63bba0f576296a52030fdd7839ca5e70d305d08f5fc2d0860
    source_lineage:
      - owner-db
      - local-storage
      - repository-seed
    source_difference: exact
    conflict_resolution: identical-across-all-captured-sources
    source_resolution_rationale: Owner database, local storage, and repository seed contain the same exact canonical payload.
    differing_fields: []
    semantic_duplicate_ids: []
    privacy_redactions: []
    gallery_classification: applicable
    affected_capabilities:
      - community-gallery
    rationale: The record changes Gallery publish and unpublish cover handling through src/services/gallery-data.ts and the public cover used by Gallery cards.
    reviewer: User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04
    import_status: imported
source_record: docs/architecture-knowledge/changelog/migration-receipt.md
---
# Quality Hub Changelog Legacy Migration Receipt

## Source Authority and Known Limitation

The exact authenticated 203-entry post-incident owner union is the approved migration source under CG-LOG-022. The earlier 170-ID membership could not be recovered, so no row is presented as proof that it belonged to that unavailable earlier set. The captured seed remains comparison evidence; it is not silently substituted for the approved owner history.

## Reconciliation Summary

All three captured sources contain 203 unique IDs. The authenticated owner and local-storage copies are identical. 47 records are exactly identical to the seed, 151 differ only by the reviewed optional empty-array representation, 2 contain reviewed reference differences, and 3 contain reviewed substantive same-ID collisions. Every nonexact row retains all source hashes, the selected lineage, differing fields, and the authority and rationale for preserving the approved owner payload. Cross-ID duplicate events remain visible rather than being deleted.

## Privacy Preservation

The private approved package retains the exact selected payload. Repository records replace only absolute local home-directory prefixes with `$HOME/`; each affected field, exact pre-redaction hash, privacy-safe preserved hash, and generated Markdown hash is recorded below.

## Community Gallery Applicability

22 records are positively verified for Community Gallery. 1 record remains explicitly pending and excluded. The remaining 180 records stay in global history without guessing other capability mappings.

## Per-record Ledger

| Legacy ID | Owner DB hash | Local storage hash | Repository seed hash | Selected raw hash | Preserved record hash | Generated Markdown hash | Source difference | Reviewed resolution | Source-resolution rationale | Source lineage | Gallery classification | Applicability rationale | Reviewer | Import status | Canonical ID |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cl-20260327-001 | 3f7bb1c705fa0dd3b5ea85949516686b7554492a3f1db7375cb1b9c55a124482 | 3f7bb1c705fa0dd3b5ea85949516686b7554492a3f1db7375cb1b9c55a124482 | 2e2b8bd26c0ed1b2e71e5716eb079fcd4592d189a8b48396f7771461bcf91b0f | 3f7bb1c705fa0dd3b5ea85949516686b7554492a3f1db7375cb1b9c55a124482 | 3f7bb1c705fa0dd3b5ea85949516686b7554492a3f1db7375cb1b9c55a124482 | 92230e838d4f417943cb8620fadcf85d26dc9a804184362c733de5efc03d48a4 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record repairs ShareStoryModal startup, which owns the Publish, Allow Edits, and Unpublish commands that create or remove Community Gallery publications. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-001 |
| cl-20260327-002 | d27be7fe2bd90a13fe5a73095795510070136cadf1b9b22680f69c80218bf8cc | d27be7fe2bd90a13fe5a73095795510070136cadf1b9b22680f69c80218bf8cc | 4053939c32ac9865d45ce4af6ff9c79ad059e1f94ee37cb907117ca4fc1a4326 | d27be7fe2bd90a13fe5a73095795510070136cadf1b9b22680f69c80218bf8cc | d27be7fe2bd90a13fe5a73095795510070136cadf1b9b22680f69c80218bf8cc | d5e13f62853ab84a4c46cc536f7812f9c83fb4f6fb8c6dac8fec7642158a1f79 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-002 |
| cl-20260327-003 | 8be2e5c571dfd77fe087744690835f05ccdf27ae14cbaa3dac517f92d496970b | 8be2e5c571dfd77fe087744690835f05ccdf27ae14cbaa3dac517f92d496970b | 8507062694f1a6209c48a190b5b38b42706060ab7a968bd213de717ad3bb81a9 | 8be2e5c571dfd77fe087744690835f05ccdf27ae14cbaa3dac517f92d496970b | 8be2e5c571dfd77fe087744690835f05ccdf27ae14cbaa3dac517f92d496970b | d0aee2dd259a4358feed6c85f616da98f3a9c28ad54c0b4dc36c79cb8a8c8297 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-003 |
| cl-20260327-004 | 85ed6a044ab8a49d8d50462d369d8e2fd4baa6f4a3e52db9264236be17a2f0f7 | 85ed6a044ab8a49d8d50462d369d8e2fd4baa6f4a3e52db9264236be17a2f0f7 | ae093e6c3a65ec897127101e45c3bd2c14244147801d64fcd37d8101d122fb2a | 85ed6a044ab8a49d8d50462d369d8e2fd4baa6f4a3e52db9264236be17a2f0f7 | 85ed6a044ab8a49d8d50462d369d8e2fd4baa6f4a3e52db9264236be17a2f0f7 | ac9b4a90ae56057ef6e1dd0bb5f95dc2d68f3cfd433edb9235e4320da3683a0a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-004 |
| cl-20260327-005 | de22ecf718df069fc46be55fd9152d2f7d5d717c1a697a8cce5e0536acb320fb | de22ecf718df069fc46be55fd9152d2f7d5d717c1a697a8cce5e0536acb320fb | b72b1a2926fe355aef988eb2eea5dbd48a5f19ba404a3c3e8b4ee424fd5bfbff | de22ecf718df069fc46be55fd9152d2f7d5d717c1a697a8cce5e0536acb320fb | de22ecf718df069fc46be55fd9152d2f7d5d717c1a697a8cce5e0536acb320fb | ee02e5a265a832049684dacf92d0128d7af37ff9ed0495356e785feb8c7dff55 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-005 |
| cl-20260327-006 | d5a61c75d75aaed3c521662a4c3a6495d46d7312e92bc30b9f6d7b3b6f1896fd | d5a61c75d75aaed3c521662a4c3a6495d46d7312e92bc30b9f6d7b3b6f1896fd | 29d8f0f5401106e20bee1e2df26ed265cf4d94d0e6c9267e9f0e3faef39894ae | d5a61c75d75aaed3c521662a4c3a6495d46d7312e92bc30b9f6d7b3b6f1896fd | d5a61c75d75aaed3c521662a4c3a6495d46d7312e92bc30b9f6d7b3b6f1896fd | d822ce7e124e6feff3f1d5da90375a03eb1a26b0d2f35451ae1838365466d831 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record changes the initial and incremental loading presentation used by Community Gallery. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-006 |
| cl-20260327-007 | 15c51ca2440bb31f7ad150d8ec401f3e262f03ba0dafa77b910421e0347f6375 | 15c51ca2440bb31f7ad150d8ec401f3e262f03ba0dafa77b910421e0347f6375 | 89dddd590c7d5df4820cad5046ca388410ca29cd071466635d17456dace05fff | 15c51ca2440bb31f7ad150d8ec401f3e262f03ba0dafa77b910421e0347f6375 | 15c51ca2440bb31f7ad150d8ec401f3e262f03ba0dafa77b910421e0347f6375 | c45876c9e33391f89567e25970b016d565c3f2341dc126d9004faf74e18ca703 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-007 |
| cl-20260327-008 | 032dc0d3877244274bd5000759fd548db387c87e2c9a85f3f4bc4f53b633d677 | 032dc0d3877244274bd5000759fd548db387c87e2c9a85f3f4bc4f53b633d677 | 90cd86bf71ba4e9e65847951c08993c8f5b71a3ad559d01095da46dd06d92f78 | 032dc0d3877244274bd5000759fd548db387c87e2c9a85f3f4bc4f53b633d677 | 032dc0d3877244274bd5000759fd548db387c87e2c9a85f3f4bc4f53b633d677 | 3ae0938ed3ac548a1a55d062dd360bd50dae861e66a7b98bf6a7701fc5a13684 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-008 |
| cl-20260327-009 | fa36a649ad91a8656838c17c4f8637d0f40cdbdfe951928e41bad5e139456af7 | fa36a649ad91a8656838c17c4f8637d0f40cdbdfe951928e41bad5e139456af7 | 0fc2ad140b2d898cf9b91910340850f6c9ef429232bfb416dbc96ace89458387 | fa36a649ad91a8656838c17c4f8637d0f40cdbdfe951928e41bad5e139456af7 | fa36a649ad91a8656838c17c4f8637d0f40cdbdfe951928e41bad5e139456af7 | b160cc338b1cf5ac6c13f8d87a8b0a52643a540d871fd6cd6f80f40015643023 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-009 |
| cl-20260327-010 | be6400fd2db3bf940af56fcdb5657b817ab4fe74e9977ebde17f47d69f5a1773 | be6400fd2db3bf940af56fcdb5657b817ab4fe74e9977ebde17f47d69f5a1773 | ef770e6931dc62d2c7e3bb5b99f6fcfd7f1dcffc78ecb46417977d15b5d8c9f0 | be6400fd2db3bf940af56fcdb5657b817ab4fe74e9977ebde17f47d69f5a1773 | be6400fd2db3bf940af56fcdb5657b817ab4fe74e9977ebde17f47d69f5a1773 | 3e2a340b93354d67ebe52be33e1932a3d61ee63853fa154fc30a205d70ba43a0 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-010 |
| cl-20260327-011 | fd6d2e8f83d85df6171cee7b7f08d5f1c3f04fd0909ca8fcffe34f507d18226c | fd6d2e8f83d85df6171cee7b7f08d5f1c3f04fd0909ca8fcffe34f507d18226c | 9b47faf49ec5ac4a8669ad32355277b7afc9e5a89c5cabe90e0baf7ffe0af5b9 | fd6d2e8f83d85df6171cee7b7f08d5f1c3f04fd0909ca8fcffe34f507d18226c | fd6d2e8f83d85df6171cee7b7f08d5f1c3f04fd0909ca8fcffe34f507d18226c | 2c94b018ced8bf3ccccecfb122bba537da79e009d4d39c25cd875054163f647c | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-011 |
| cl-20260327-012 | d41ad71aad9a9fe7fed90fa3ba45c78aa4768acc699d127bb989fb53866eb647 | d41ad71aad9a9fe7fed90fa3ba45c78aa4768acc699d127bb989fb53866eb647 | dcedc1a4fe44b27bdb708c2c1ebe8547ff59cd03788ce239538903c5657f2aea | d41ad71aad9a9fe7fed90fa3ba45c78aa4768acc699d127bb989fb53866eb647 | d41ad71aad9a9fe7fed90fa3ba45c78aa4768acc699d127bb989fb53866eb647 | 2eff9ce0016d63b7b0686bd6aec0c6967fcf5d5cb4dec52e4d5550ad96c4ff5c | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-012 |
| cl-20260327-013 | 3f57184e9e7a17708eb1b9c9d69ef8a619d66128c7af90f8659b2d93d597ee87 | 3f57184e9e7a17708eb1b9c9d69ef8a619d66128c7af90f8659b2d93d597ee87 | 8f652e828b84b275681687c55ffb2537760eb3e601d7548063d2bb9ae631f892 | 3f57184e9e7a17708eb1b9c9d69ef8a619d66128c7af90f8659b2d93d597ee87 | 3f57184e9e7a17708eb1b9c9d69ef8a619d66128c7af90f8659b2d93d597ee87 | d3f8d661292948afdbd627827a0a8dcb5b9c92e02ff50cdb577a6c128e4ad782 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-013 |
| cl-20260327-014 | a4c4b7f9c2921b9e8d4499d5aa86f81b7900e14276a9646550f2b471ad5c11c9 | a4c4b7f9c2921b9e8d4499d5aa86f81b7900e14276a9646550f2b471ad5c11c9 | 31451e0eb0a72f1d94eaa646cd2c3c6b7608571f3ec78ce38c30e2e6f472361f | a4c4b7f9c2921b9e8d4499d5aa86f81b7900e14276a9646550f2b471ad5c11c9 | a4c4b7f9c2921b9e8d4499d5aa86f81b7900e14276a9646550f2b471ad5c11c9 | 4f73c26439949a5aaa61d5a72b21b332e9a82c2c1d5d363680119de3bba6fb54 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-014 |
| cl-20260327-015 | d8a96637fd729a162ff285564a35ca406ae6b5ae76ffcab3bd09dcd22d2d1d08 | d8a96637fd729a162ff285564a35ca406ae6b5ae76ffcab3bd09dcd22d2d1d08 | 22fe95c6f2bc8faaa9ccb10b5afe700e7f465c63dddacc5d8778936ae487d76d | d8a96637fd729a162ff285564a35ca406ae6b5ae76ffcab3bd09dcd22d2d1d08 | d8a96637fd729a162ff285564a35ca406ae6b5ae76ffcab3bd09dcd22d2d1d08 | 9dde063d1aba6f9b6a3f6719d45179058ba7f5bb7ad822740104c9dbe2c27a33 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-015 |
| cl-20260327-016 | 95e95011ca2055f008a920d0c5b712a16f17dd0427382f6280d38c56c6a87e14 | 95e95011ca2055f008a920d0c5b712a16f17dd0427382f6280d38c56c6a87e14 | c008fb40002b3ded85f2e2b5c5907da02bab19d4d28f55ec6d560bae0eedff24 | 95e95011ca2055f008a920d0c5b712a16f17dd0427382f6280d38c56c6a87e14 | 95e95011ca2055f008a920d0c5b712a16f17dd0427382f6280d38c56c6a87e14 | 4f1a3414013938f3891b67b812f369afd0f9788a3dfc8b251355e23bdd12bbab | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-016 |
| cl-20260327-017 | 686c45e2c54c776d3f75860a039a44bb6b1cbbed888a59010d5471308b4f0208 | 686c45e2c54c776d3f75860a039a44bb6b1cbbed888a59010d5471308b4f0208 | 59047efd6f2d1b2fdfa74a6d8f53b3acba2b34562f1fc72f41bd1c309dca383f | 686c45e2c54c776d3f75860a039a44bb6b1cbbed888a59010d5471308b4f0208 | 686c45e2c54c776d3f75860a039a44bb6b1cbbed888a59010d5471308b4f0208 | 0f984c27f58d4f8a332cc918b9eba48a425c1dcb15f58b2a05e57f21c14117b0 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-017 |
| cl-20260327-018 | 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4 | 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4 | 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4 | 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4 | 27bbda94e21ab020d10d8f4c8beea775b96275d8165dd8635b2c4d5b945c85c4 | 63910caf32c627cf300d00c15c2c096f158efe2db6ba63f8644cf6cb54383c7c | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260327-018 |
| cl-20260328-001 | 758f13887d73cab028e7adc932b32d3ad2658dd80a60e55793e2b8e523866b23 | 758f13887d73cab028e7adc932b32d3ad2658dd80a60e55793e2b8e523866b23 | a279b8375df9442ab69cee4cfc75dc6dd300b8ecffc78fdf34f8e8133b84bf3a | 758f13887d73cab028e7adc932b32d3ad2658dd80a60e55793e2b8e523866b23 | 758f13887d73cab028e7adc932b32d3ad2658dd80a60e55793e2b8e523866b23 | 7391f26887b93d6462d15e7474c3e2483350b57446880b5bcae30ad89b1f190a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-001 |
| cl-20260328-002 | 44f6ef81ed6f74645f799f227b7c5d6e704e8589f5107b49e0b93ad7c953ac53 | 44f6ef81ed6f74645f799f227b7c5d6e704e8589f5107b49e0b93ad7c953ac53 | 5bd46aee24d3ac0e2df9b632e53f9c4102431ab60a02debf6a6a7804729145d4 | 44f6ef81ed6f74645f799f227b7c5d6e704e8589f5107b49e0b93ad7c953ac53 | 44f6ef81ed6f74645f799f227b7c5d6e704e8589f5107b49e0b93ad7c953ac53 | 11af24e7bd26d96e9450fcd570dcb7bc215d6a3bb7999b2fb2963bfcd4ed0f7a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-002 |
| cl-20260328-003 | 41f888ec28a101cc7e976188cd2e8cf6a46ef1964f05d37395eeb0c333bb4c22 | 41f888ec28a101cc7e976188cd2e8cf6a46ef1964f05d37395eeb0c333bb4c22 | 009bae30ba5793a9482acede49da2641f8f7e323ca301335d53e27d6714b9441 | 41f888ec28a101cc7e976188cd2e8cf6a46ef1964f05d37395eeb0c333bb4c22 | 41f888ec28a101cc7e976188cd2e8cf6a46ef1964f05d37395eeb0c333bb4c22 | a808f9ca85126e57319adf90ca98d23db65fc5875d91096dc73d397e736ad4e3 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-003 |
| cl-20260328-004 | c133e075808b109a171035179ba90a535c5df9cd685a914670ed727e4052fc3d | c133e075808b109a171035179ba90a535c5df9cd685a914670ed727e4052fc3d | 283805cd3a6d7020a0aaaefed02549ce673bde20b8a1f6e9ff28e7de3a1d2355 | c133e075808b109a171035179ba90a535c5df9cd685a914670ed727e4052fc3d | c133e075808b109a171035179ba90a535c5df9cd685a914670ed727e4052fc3d | b32e11759c0dc2687cc336d577feef5c06515d4ad86436572751c3ca5f36721b | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-004 |
| cl-20260328-005 | 05cc164852dfc3345a110679f820b71083dcb80f029abe7e1aaaf2d20f58fbe0 | 05cc164852dfc3345a110679f820b71083dcb80f029abe7e1aaaf2d20f58fbe0 | e2198ec25bb726781cfd92194960a82d1fa76808e2993cbea88b6783a221e412 | 05cc164852dfc3345a110679f820b71083dcb80f029abe7e1aaaf2d20f58fbe0 | 05cc164852dfc3345a110679f820b71083dcb80f029abe7e1aaaf2d20f58fbe0 | b9c8731475a199aae95fc5da5d8f4ee012d849073b7fb892c1babc8ea4ea1be9 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-005 |
| cl-20260328-006 | d2dc90dd6051c873665112106f315486148bd18dbd4b1b2c44232b982512a09d | d2dc90dd6051c873665112106f315486148bd18dbd4b1b2c44232b982512a09d | 663ad2c070ad07f6d37b25e376646d035cb45a2197ef9c4c673006adf6cdb1d9 | d2dc90dd6051c873665112106f315486148bd18dbd4b1b2c44232b982512a09d | d2dc90dd6051c873665112106f315486148bd18dbd4b1b2c44232b982512a09d | 7245c2bf7c7b2bdbd768b25a67ef1cf129e336dc53408f0b3462f4143e8d1bab | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-006 |
| cl-20260328-007 | 4118e8a69a8e242e8bb7d9ae442f08178e0d92b5ebc41cdc3aef9d529456e554 | 4118e8a69a8e242e8bb7d9ae442f08178e0d92b5ebc41cdc3aef9d529456e554 | e1ad0870e986f841ad5c3b1f4475139e9130dbf07e714b248af51c1985342d58 | 4118e8a69a8e242e8bb7d9ae442f08178e0d92b5ebc41cdc3aef9d529456e554 | 4118e8a69a8e242e8bb7d9ae442f08178e0d92b5ebc41cdc3aef9d529456e554 | 4058aacc22a2d769731ab532b964ae34a38a64ab92b693735df6d17c9fc5ddbb | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-007 |
| cl-20260328-008 | e7f7636aebba6f67450e864c922746dd35ea9f0b1c4f4c997ab12a690756cb9f | e7f7636aebba6f67450e864c922746dd35ea9f0b1c4f4c997ab12a690756cb9f | d9d02cee9757fc9b5100e013f3bd310530646997b849cceec2c698cec6c1a478 | e7f7636aebba6f67450e864c922746dd35ea9f0b1c4f4c997ab12a690756cb9f | e7f7636aebba6f67450e864c922746dd35ea9f0b1c4f4c997ab12a690756cb9f | 45b570306c4d7243bb844bc57d823b1ef04658747bf316ece7ab0f765a7448fd | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-008 |
| cl-20260328-009 | c174829aea710bbfc4c9f9998064362139a86e8887662ae132453ea6a7668165 | c174829aea710bbfc4c9f9998064362139a86e8887662ae132453ea6a7668165 | 3adc3d4c87dc8f0281838d8988fff1bde82dfd97f952851ca7a2b42d80edd8fa | c174829aea710bbfc4c9f9998064362139a86e8887662ae132453ea6a7668165 | c174829aea710bbfc4c9f9998064362139a86e8887662ae132453ea6a7668165 | 63d81cbb90f0943e09b179d1e7110caf99f6c1b1308ccf3dafa31bf004f1e0ce | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260328-009 |
| cl-20260330-001 | 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa | 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa | 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa | 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa | 16b53d1a2f1258ae0a4c9959b52162fbed798531e50a3f252c7529a7f4f5bdaa | 6ec7f2cdb9705293d15b5600b55551f59c3b5ba47ba8e275c1c86777e0183002 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes GalleryStoryCard ref behavior as part of a cross-surface runtime-stability pass. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260330-001 |
| cl-20260330-002 | 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f | 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f | 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f | 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f | 093a7033b3f752ac391c7dc7c00f761ac18f923c5fb44f8ed6c768a921e1353f | 3404394ae108ee3ee71871411455d4a8f944b04d141d1ee937fa9ba50dbb41a1 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260330-002 |
| cl-20260330-003 | b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2 | b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2 | b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2 | b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2 | b6c08fd53f5f0fdb750184d14e0c358868dea348a3d341e1b781391f07d40bd2 | cbcf03059ec401c020eb2e5b219d9276531c1847df1a75e40e39b1f4cbbe9cc7 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260330-003 |
| cl-20260330-004 | daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf | daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf | daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf | daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf | daaf9e3ccc4729ad846a1b7c32ec10366fe08e6d6ca7f962aa5f857fee9196cf | 65e64288ab36c91afa84c42f74a2c8b2ee94b00ab8b7a29231009a6706e54a37 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260330-004 |
| cl-20260331-001 | 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59 | 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59 | 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59 | 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59 | 1c07a9cc990b9879b20b8ac55ee23f77be064bc95d63a60a888e992c29b3ab59 | 89ed354f78078643ea6414af513f51f03ad794cc834a686b25606f0c8ce30265 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260331-001 |
| cl-20260331-002 | 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78 | 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78 | 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78 | 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78 | 0d69e59ddc087819f747f10c4f6cae8a1c66862197adc8178d4d35c980a46b78 | bfdfe633e0d0fe051d4a1076eb3f06e3528f6096461d4ecd116bb68bdd8d2762 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260331-002 |
| cl-20260331-003 | 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5 | 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5 | 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5 | 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5 | 8ab7a064639b1dd9f8b238c2c90bffe6f12e50cbd1cfc3a81ce29069038e74f5 | ac3c2faffaf885800f1bb304d446b71442e6b548498e7c336d4c77e11d6e26f7 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260331-003 |
| cl-20260331-004 | 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be | 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be | 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be | 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be | 9c3d0ad7a9025ccde573ca6f6fb5c191a76a176f6d3395e909be11ed6f2f34be | c48c954098f900b8ad710700c53a19356aca424cfd33e8a5aee9b83c68ada52f | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260331-004 |
| cl-20260331-005 | 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37 | 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37 | 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37 | 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37 | 047003028fd9bf361bf3f28c6c1b0c65cb725ca822c730656f52fbbe0ae32f37 | 04431d9e86b4534d918e6c95e54c091d258fbdd04c910ceeddb008c1f02162b6 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | pending_excluded | The record mentions Community Gallery guide maintenance inside a broader tooling-integrity sweep, but the approved review found no stronger evidence of a Community Gallery product or runtime change. It remains globally preserved and excluded from the Gallery projection pending stronger evidence. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260331-005 |
| cl-20260331-006 | 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288 | 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288 | 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288 | 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288 | 30945537f0d4a3ffacf97d3aa1045a567bff71002e2b4f23f99dd2cd69123288 | 6eecb3efa474ce54605414d4e48ad8581a3a9adb51103648cd6dbfb1984149a2 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260331-006 |
| cl-20260331-007 | 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907 | 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907 | 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907 | 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907 | 0111d544b7a99636a6ac522d068939585d885aa1ff376777414fd8a380477907 | 02dd1fedc9588cc3803e5a269ef88212a48b03a091d1142cbba1f25481ed8891 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260331-007 |
| cl-20260331-008 | 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0 | 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0 | 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0 | 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0 | 4ea8a50c2a8b414ebf2a3d41d3030d8169932a8d3b3ddd05dc2859c8dac3cfd0 | 0aceff2321f489e5d6c535ca17599af564969ae4acf3cf284548bfc8cadd0283 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260331-008 |
| cl-20260401-001 | ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8 | ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8 | ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8 | ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8 | ac77527a78bf74514f7d5e7b2d3d80038e70f6f34f615a3057f6e9530f5c70a8 | b146a7b4ae88a7ca92aa91c52db62973cddb8bb40021971bb51ae55c70650738 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260401-001 |
| cl-20260401-002 | 692285da7ab6b3eb7e73c1decf1854eb50dc778277d588f9917d25ab6cf36bf5 | 692285da7ab6b3eb7e73c1decf1854eb50dc778277d588f9917d25ab6cf36bf5 | 59a39061b3e63a6f4229e980ffd95eadab35d5ac49101db2189039afc24ca11b | 692285da7ab6b3eb7e73c1decf1854eb50dc778277d588f9917d25ab6cf36bf5 | 692285da7ab6b3eb7e73c1decf1854eb50dc778277d588f9917d25ab6cf36bf5 | fadbe386b120c92633258897a5d878cceb500424ddbbfaf0b1f54e4800b0b1f6 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260401-002 |
| cl-20260401-003 | def78c5f961a809b55cfd4875f247b96f03e5b7d9b72cd2ab413618c60e67da9 | def78c5f961a809b55cfd4875f247b96f03e5b7d9b72cd2ab413618c60e67da9 | bec081af3430db5d3b8375b91e7a5f7c8cce477c1aacca8f461411f592233158 | def78c5f961a809b55cfd4875f247b96f03e5b7d9b72cd2ab413618c60e67da9 | def78c5f961a809b55cfd4875f247b96f03e5b7d9b72cd2ab413618c60e67da9 | 0093547ca93d7a24ca1c1d31e8eb4e3706ccf48ab11f072319082ad97b027898 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260401-003 |
| cl-20260401-004 | ec05ae331fc21c339237c65ff4f776f5173a67457734a7a392c7403d06ebc71d | ec05ae331fc21c339237c65ff4f776f5173a67457734a7a392c7403d06ebc71d | 0dae1dac6039c72b5127354cff5bd1026d89d4d5dc8fbc178d49ba917047f033 | ec05ae331fc21c339237c65ff4f776f5173a67457734a7a392c7403d06ebc71d | ec05ae331fc21c339237c65ff4f776f5173a67457734a7a392c7403d06ebc71d | 015188190a6b0f70be4d888ec692f54d12e9611a2f689e1f049a82270cf378d5 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260401-004 |
| cl-20260401-005 | aa0af56d75beb9e688a66ffbf4a86d4d39c677e10b9cca6919485a64b49d59e8 | aa0af56d75beb9e688a66ffbf4a86d4d39c677e10b9cca6919485a64b49d59e8 | fbb159aaf420d102e61ed8dfbf706e0ae875c6a0accfab2e4e4dc3c746038c74 | aa0af56d75beb9e688a66ffbf4a86d4d39c677e10b9cca6919485a64b49d59e8 | aa0af56d75beb9e688a66ffbf4a86d4d39c677e10b9cca6919485a64b49d59e8 | a412e84f2e38bce03dd4cfa14cbb761810c789b56b4f6945dbf61fc9b0fb6bd5 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260401-005 |
| cl-20260402-001 | b59f65f298db22cf285731cc848b54ec43db136eb0eac5a36c8e325e24226228 | b59f65f298db22cf285731cc848b54ec43db136eb0eac5a36c8e325e24226228 | f031fa2159e1cd60f2888265e65d3bec24d9a156c5ea9fd4b6628b1b183d2f2a | b59f65f298db22cf285731cc848b54ec43db136eb0eac5a36c8e325e24226228 | b59f65f298db22cf285731cc848b54ec43db136eb0eac5a36c8e325e24226228 | 41de6b5187f629815c17249616f0dca1e97b2b9728218950966d731533dfc6ba | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260402-001 |
| cl-20260402-002 | 884438ec01afb4a9e871b9c5f92000af69abb75ca1d0de0ef4cd124e71a8a7b7 | 884438ec01afb4a9e871b9c5f92000af69abb75ca1d0de0ef4cd124e71a8a7b7 | 768a2bd2bb91244d9d7070765092d6f22a612e68d32dce35f6f4e235c769d199 | 884438ec01afb4a9e871b9c5f92000af69abb75ca1d0de0ef4cd124e71a8a7b7 | 884438ec01afb4a9e871b9c5f92000af69abb75ca1d0de0ef4cd124e71a8a7b7 | e1492e2cb1e134e1c61efc3f8b95ba6815a511f080c98ae2ec3505932e883831 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260402-002 |
| cl-20260404-001 | 1213c31c3b664427e88ad696235e8ce7afafc95258e2936487cd9ddf1d85b88a | 1213c31c3b664427e88ad696235e8ce7afafc95258e2936487cd9ddf1d85b88a | a09bcaad8344a88c74bc30a48a9503e631d53e6a0b4303d2bb9b1a703f541e3f | 1213c31c3b664427e88ad696235e8ce7afafc95258e2936487cd9ddf1d85b88a | 1213c31c3b664427e88ad696235e8ce7afafc95258e2936487cd9ddf1d85b88a | 889789cdd92e29b0bdc7cd8e7e3db7a40607e0c047a3e097b6115794b840744c | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-001 |
| cl-20260404-002 | 1c71157a715874b1db94b6f2f34ad460608f00afe15ee56ea74823080c821091 | 1c71157a715874b1db94b6f2f34ad460608f00afe15ee56ea74823080c821091 | f9faf54ed91d202b4b204cea4fe26bff7c57035f6c19c6b01cde1055cc595ee5 | 1c71157a715874b1db94b6f2f34ad460608f00afe15ee56ea74823080c821091 | 1c71157a715874b1db94b6f2f34ad460608f00afe15ee56ea74823080c821091 | d4e88f643a48986384ab0917c4355eb704bbc3e3f566bda9b4131fce8b1402e8 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-002 |
| cl-20260404-003 | a0c31962e16f5de9e05c9f51ad2468a83d4a3cd35972fc22248192d69b8f9430 | a0c31962e16f5de9e05c9f51ad2468a83d4a3cd35972fc22248192d69b8f9430 | 8869733a3d95eeb0eb99674d9af9c8ca5297ad2f7bb3272f64a43a436688fb88 | a0c31962e16f5de9e05c9f51ad2468a83d4a3cd35972fc22248192d69b8f9430 | a0c31962e16f5de9e05c9f51ad2468a83d4a3cd35972fc22248192d69b8f9430 | d981ca057af589173dff3095bed329868217ac70167e2caccaeb979ecd171065 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-003 |
| cl-20260404-004 | a2b4c5f8f6282d9d17bf1456814e1c17b3fd477fa80e0f776832699e2ad3be88 | a2b4c5f8f6282d9d17bf1456814e1c17b3fd477fa80e0f776832699e2ad3be88 | 50c25b7ed55df808a80d9826c20c1b3ce7ea7ae02624ffbb8eba5091b2d0267b | a2b4c5f8f6282d9d17bf1456814e1c17b3fd477fa80e0f776832699e2ad3be88 | a2b4c5f8f6282d9d17bf1456814e1c17b3fd477fa80e0f776832699e2ad3be88 | 77bbde549a04653ff488ab6557603d87968a8fc054f2b34d03d1f352f0a081b7 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record changes Gallery container refs and pre-auth request behavior on the delivered Gallery shell. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-004 |
| cl-20260404-005 | c819bae2fe868d1dae3b10d5e6cbb374bf00eb43468a6e867d17f818bc3de24a | c819bae2fe868d1dae3b10d5e6cbb374bf00eb43468a6e867d17f818bc3de24a | 72ddd72888fd6977a3f03f08e77f7da57111201be36dab1b447a85ccde5d7cfe | c819bae2fe868d1dae3b10d5e6cbb374bf00eb43468a6e867d17f818bc3de24a | c819bae2fe868d1dae3b10d5e6cbb374bf00eb43468a6e867d17f818bc3de24a | c1719970a32831df540c4016d11251851eb9d043f61d2826f440833340be778a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-005 |
| cl-20260404-006 | b89d381538f5bb3c6e58448e2c0099f5fc43a20acd818abfe84e318ae07490cb | b89d381538f5bb3c6e58448e2c0099f5fc43a20acd818abfe84e318ae07490cb | 0491265bd5bff731226ada74e89adcc80d588293ee654d1df366724cec31070e | b89d381538f5bb3c6e58448e2c0099f5fc43a20acd818abfe84e318ae07490cb | b89d381538f5bb3c6e58448e2c0099f5fc43a20acd818abfe84e318ae07490cb | 75c3d3cf4d1cc8c586407e23ea86e4294a5b5a053dae7f9b8e895e100434f46e | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-006 |
| cl-20260404-007 | 947eb73a53a6a0624f99b599475a294035722de62d9926461c088a1090c584d5 | 947eb73a53a6a0624f99b599475a294035722de62d9926461c088a1090c584d5 | a6cd82c9bac6840a0cd16b65cd3f7658afead96cf51fdbeec6bc9bc44581f596 | 947eb73a53a6a0624f99b599475a294035722de62d9926461c088a1090c584d5 | 947eb73a53a6a0624f99b599475a294035722de62d9926461c088a1090c584d5 | 7f9d5d6cd7767773f24b07f5f2a1017736b79480e47515de33ad9c625f775739 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-007 |
| cl-20260404-008 | 1f53716f678d37edd3c2b11fa64252539feaa37e874bd38b0d32c94d5ce801a7 | 1f53716f678d37edd3c2b11fa64252539feaa37e874bd38b0d32c94d5ce801a7 | 59773b3848c94278434e78dfb2c8404ff64794741098bb61d5e58d2d3f16d4e0 | 1f53716f678d37edd3c2b11fa64252539feaa37e874bd38b0d32c94d5ce801a7 | 1f53716f678d37edd3c2b11fa64252539feaa37e874bd38b0d32c94d5ce801a7 | 822cd2d78bf81dec87ce2ca18d6841af41d6b6eb8502e309b5a8492b9b97184d | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-008 |
| cl-20260404-009 | a66692fb594c4a259c140364adca9953aa7230223dd19f9f7fa1acb09a07c4f5 | a66692fb594c4a259c140364adca9953aa7230223dd19f9f7fa1acb09a07c4f5 | 1819074e1c25159944badfdbd73e23eb28938482be782e90773cf80d9c93467c | a66692fb594c4a259c140364adca9953aa7230223dd19f9f7fa1acb09a07c4f5 | a66692fb594c4a259c140364adca9953aa7230223dd19f9f7fa1acb09a07c4f5 | 8b017467d73977c41d4002bbce7bbbf058990ebc08d1472992f04fb9ddeca54b | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-009 |
| cl-20260404-010 | 0a2d47509c1b4a17db21bd7f8e1ed4916a2ae58ac8b3e934dec2c7dfcf7f24b4 | 0a2d47509c1b4a17db21bd7f8e1ed4916a2ae58ac8b3e934dec2c7dfcf7f24b4 | 111b001a0ccb53c7da15efd59caa30d131a0e34c5859a8902cf688b88a7c350c | 0a2d47509c1b4a17db21bd7f8e1ed4916a2ae58ac8b3e934dec2c7dfcf7f24b4 | 0a2d47509c1b4a17db21bd7f8e1ed4916a2ae58ac8b3e934dec2c7dfcf7f24b4 | 4528ace00adb1bfaa8c3b2871829c6bacf5346f0afdc8ea5ec6c1b4a949adb0f | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-010 |
| cl-20260404-011 | 49a76b28a647f2eb513dbebadd28ebb8b98f8c4d0d93b45438a82e3eff7109d8 | 49a76b28a647f2eb513dbebadd28ebb8b98f8c4d0d93b45438a82e3eff7109d8 | 08ac3765fbe3ae0b7e7f3b2e6485a116eba849c3213c1ae6af3ac7279a00d003 | 49a76b28a647f2eb513dbebadd28ebb8b98f8c4d0d93b45438a82e3eff7109d8 | 49a76b28a647f2eb513dbebadd28ebb8b98f8c4d0d93b45438a82e3eff7109d8 | 3bbd676a6fc5949a557f7e7308fb54dab5b44fd7b6439348dd8fc965872a7460 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-011 |
| cl-20260404-012 | 0030069e21f1d041bf17dca1ed7957d4e1854838f59487eae80a4d70291d9257 | 0030069e21f1d041bf17dca1ed7957d4e1854838f59487eae80a4d70291d9257 | e7215b56a329760d42bfcb8698d68c1747f4cccb5d517500a42d9b4981f76647 | 0030069e21f1d041bf17dca1ed7957d4e1854838f59487eae80a4d70291d9257 | 0030069e21f1d041bf17dca1ed7957d4e1854838f59487eae80a4d70291d9257 | 81f993e1413d49c5f48f2ff8dd2b558b8a86738dfd820fd7eb5cc9a8d9b0cb1c | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-012 |
| cl-20260404-013 | b93373d2dc03a816646f7bb3eef4bc9ce25b1a36b4639cc5042de7c4c2caf86e | b93373d2dc03a816646f7bb3eef4bc9ce25b1a36b4639cc5042de7c4c2caf86e | 27debb30f4cc1eb0ebd1393243efe5166f64f229bfb759ed2f929d6fa45b3828 | b93373d2dc03a816646f7bb3eef4bc9ce25b1a36b4639cc5042de7c4c2caf86e | b93373d2dc03a816646f7bb3eef4bc9ce25b1a36b4639cc5042de7c4c2caf86e | e26e69e371c79d93cd503ccae6c64b4c9867f0b1bcb03128cc27f4683d94177d | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-013 |
| cl-20260404-014 | 6cfcffb3fc63fa2735abbae33787d8e19b3ffc8f5217fa12254bde4b43c60bb1 | 6cfcffb3fc63fa2735abbae33787d8e19b3ffc8f5217fa12254bde4b43c60bb1 | a60a7b12d0ec6345ab783d8433397a76d83147ea2ddae29ff4e31a280143c242 | 6cfcffb3fc63fa2735abbae33787d8e19b3ffc8f5217fa12254bde4b43c60bb1 | 6cfcffb3fc63fa2735abbae33787d8e19b3ffc8f5217fa12254bde4b43c60bb1 | 713e2f339c5d1feac1fcc2ce5c4f3ed27d18ea7f120dededf6659c40307ddd22 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-014 |
| cl-20260404-015 | 089d47523488b88c6a41cd209b031e4ec817a3b19dd4cdee27f439b301433e8a | 089d47523488b88c6a41cd209b031e4ec817a3b19dd4cdee27f439b301433e8a | 1202b208c6d1302172adbea65eb4b2d93bef0d28a3b6a0d18e5e13a21b0fabf4 | 089d47523488b88c6a41cd209b031e4ec817a3b19dd4cdee27f439b301433e8a | 089d47523488b88c6a41cd209b031e4ec817a3b19dd4cdee27f439b301433e8a | bf6722370876c91cce24ed7e49a1e94eb903bf7c08c98f8e014aa1e4d1565a54 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260404-015 |
| cl-20260405-001 | e8da7bc879b5578366d84b36103faf6ccb8c3e37e2a7598de0f94850fbbccf09 | e8da7bc879b5578366d84b36103faf6ccb8c3e37e2a7598de0f94850fbbccf09 | 48a88e79f1d67864b3b12a2cea152ca487169fe459710937dd4dbcd087bc4656 | e8da7bc879b5578366d84b36103faf6ccb8c3e37e2a7598de0f94850fbbccf09 | e8da7bc879b5578366d84b36103faf6ccb8c3e37e2a7598de0f94850fbbccf09 | e43024385468962365919784ca94d452e6de1798f401fe2bbe7a5517fd97cbde | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record changes the Story Detail modal and review call to action used by Community Gallery and My Stories. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260405-001 |
| cl-20260405-002 | f06961ef7bc87c176b49b64096e651e2adffaf7a5d872681d79ecb05f8da3e3f | f06961ef7bc87c176b49b64096e651e2adffaf7a5d872681d79ecb05f8da3e3f | 118c9a907a464fc35260e5eacba26165774265693394357bae4fc529bd82e15f | f06961ef7bc87c176b49b64096e651e2adffaf7a5d872681d79ecb05f8da3e3f | f06961ef7bc87c176b49b64096e651e2adffaf7a5d872681d79ecb05f8da3e3f | 4a0cd657e47ef027fd0f0de7afff6d1c7579724005e4135b94f3e848060cc526 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record changes the review modal and Story Detail review flow shared by Community Gallery and My Stories. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260405-002 |
| cl-20260410-001 | d1ba09a60a4aaa600207a8cb78bfcbfbeac2bfb0a7de73ca5f5ffa591d5ccf52 | d1ba09a60a4aaa600207a8cb78bfcbfbeac2bfb0a7de73ca5f5ffa591d5ccf52 | f88528dd9722b9430ea2d61ab5081f68b6483704db353fcec590940c5bc8d165 | d1ba09a60a4aaa600207a8cb78bfcbfbeac2bfb0a7de73ca5f5ffa591d5ccf52 | d1ba09a60a4aaa600207a8cb78bfcbfbeac2bfb0a7de73ca5f5ffa591d5ccf52 | ef790e971043be37c0154c1943cb7b073c4c0a92060c246ac5cf445a71de98cf | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record directly changes the Community Gallery discovery shell, category rail, search, and filters. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260410-001 |
| cl-20260411-001 | 2d536317bd3e5453db386782a893f04d2712814b296861ec4a3f3c2bfdb1d366 | 2d536317bd3e5453db386782a893f04d2712814b296861ec4a3f3c2bfdb1d366 | 11bac12543ea97e4940a660f041146f15530e5da055f84aedea85b4e08e4fdb0 | 2d536317bd3e5453db386782a893f04d2712814b296861ec4a3f3c2bfdb1d366 | 2d536317bd3e5453db386782a893f04d2712814b296861ec4a3f3c2bfdb1d366 | 770ef6ed0ac8f434b9e795ef82658a18adfd44c95059b872aeb9f5fbd18c8d65 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260411-001 |
| cl-20260411-002 | c047944160f4e53334c9723bf4cafff7736facc05edf07137430b43dabb5a68f | c047944160f4e53334c9723bf4cafff7736facc05edf07137430b43dabb5a68f | cd9aef5ca6e70f7b97916e29e5992d8c72df30fb2c8ae97c2fd5cad12553a83e | c047944160f4e53334c9723bf4cafff7736facc05edf07137430b43dabb5a68f | c047944160f4e53334c9723bf4cafff7736facc05edf07137430b43dabb5a68f | bdb33282f2a1de869989478ce93d83455311c9d7dc21d80c02687aaa96a665b1 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record directly adds Community Gallery adult-content preference, confirmation, masking, and service behavior. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260411-002 |
| cl-20260411-003 | 85b743b7b59b2e612af08d9319b62cead6c98501e25281a76454e505338798ba | 85b743b7b59b2e612af08d9319b62cead6c98501e25281a76454e505338798ba | 91d124508fc10e7cef5b063a4299ea9935bc838d8303172a5d8ee83637cc1c24 | 85b743b7b59b2e612af08d9319b62cead6c98501e25281a76454e505338798ba | 85b743b7b59b2e612af08d9319b62cead6c98501e25281a76454e505338798ba | 2274b2fd69bd316a8eb753728166a513446a7adf923d82a01279192490d03ade | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260411-003 |
| cl-20260411-004 | 00d0852cca1aaefff6a738d4fac5491b7b7947e455e1e5e234725b91c2424d41 | 00d0852cca1aaefff6a738d4fac5491b7b7947e455e1e5e234725b91c2424d41 | 06a45f54d6b1ec9b99a501d1c5a6e5fa70aa94cee6b34da32781b86d5c1f89c5 | 00d0852cca1aaefff6a738d4fac5491b7b7947e455e1e5e234725b91c2424d41 | 00d0852cca1aaefff6a738d4fac5491b7b7947e455e1e5e234725b91c2424d41 | e4c487a9ffdf1a3effb5cede27fddc07498a1fc89e4c89e33ee82967a3ebde88 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260411-004 |
| cl-20260411-005 | 9c04613969e3ce9c332442b2f90761bb9081a3bd8b5c12fa804a043048ff7f81 | 9c04613969e3ce9c332442b2f90761bb9081a3bd8b5c12fa804a043048ff7f81 | 44bc7a1bb32fedc30ee72445d11519e594d55dbaf58365c527669f526631efa6 | 9c04613969e3ce9c332442b2f90761bb9081a3bd8b5c12fa804a043048ff7f81 | 9c04613969e3ce9c332442b2f90761bb9081a3bd8b5c12fa804a043048ff7f81 | 9a1bcb753472f54987697f27573f747e2d7f3c7551d9e7005e535c5645f304b7 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260411-005 |
| cl-20260412-001 | 3f7ca4246734dd4dd619218ab35a2fb670acd2e25c4cf75cdeb88a8f39089bc6 | 3f7ca4246734dd4dd619218ab35a2fb670acd2e25c4cf75cdeb88a8f39089bc6 | 731b4708b462521b343a3b62361fbf735a2857ed5014774ac9e94ea003222f53 | 3f7ca4246734dd4dd619218ab35a2fb670acd2e25c4cf75cdeb88a8f39089bc6 | 3f7ca4246734dd4dd619218ab35a2fb670acd2e25c4cf75cdeb88a8f39089bc6 | 28f04c6074f3095c10eb682eab280c1b5b6447b75a78a265e6fdc2c4d14f8817 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260412-001 |
| cl-20260412-002 | 80bde3a36c5559651607ebc9ef3d5f9fad1e35f28956dd3743215017b98b3d9a | 80bde3a36c5559651607ebc9ef3d5f9fad1e35f28956dd3743215017b98b3d9a | 216e7ad29de42efb197a48fca48b692f0c2d9bee538fb48399166121839806b7 | 80bde3a36c5559651607ebc9ef3d5f9fad1e35f28956dd3743215017b98b3d9a | 80bde3a36c5559651607ebc9ef3d5f9fad1e35f28956dd3743215017b98b3d9a | 209687472e241c2fdf4e460c290f811ec059667b3cba32c0ff71c785859effbf | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260412-002 |
| cl-20260412-003 | f86ddb9f270814f41383751b6ca4dd913c1a064f71574e00828fafea54091723 | f86ddb9f270814f41383751b6ca4dd913c1a064f71574e00828fafea54091723 | c388ce63cf881455eb4c35f9be7b1fdf62045783428af2fe4248ce5544e772a0 | f86ddb9f270814f41383751b6ca4dd913c1a064f71574e00828fafea54091723 | f86ddb9f270814f41383751b6ca4dd913c1a064f71574e00828fafea54091723 | e6cccf5010d87589f2ece5fe369091a92133b06bdbd3c19953d34c6fd73fccce | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260412-003 |
| cl-20260412-004 | d94eda14cbfabe399c08521b74f4f503ca0469c23539f8d99f54eb4150aba9c4 | d94eda14cbfabe399c08521b74f4f503ca0469c23539f8d99f54eb4150aba9c4 | e81ae0b6cffed33819e72727274cb30e8aafe3b8036d1bdf96e1238d6c4b35c0 | d94eda14cbfabe399c08521b74f4f503ca0469c23539f8d99f54eb4150aba9c4 | d94eda14cbfabe399c08521b74f4f503ca0469c23539f8d99f54eb4150aba9c4 | ea40522aeb6177a794a0577b5ffc5552f43b8d795915f9f72fc9b2ed9579b68f | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260412-004 |
| cl-20260412-005 | 114d050c5bb6e1b025b256cc3110e520de2d6b2f446e8a223bac8a68f914baee | 114d050c5bb6e1b025b256cc3110e520de2d6b2f446e8a223bac8a68f914baee | 0b67671c478ae3540edd64c8f9f787817e624cc3f2299d65322d39d6126fc5b8 | 114d050c5bb6e1b025b256cc3110e520de2d6b2f446e8a223bac8a68f914baee | 114d050c5bb6e1b025b256cc3110e520de2d6b2f446e8a223bac8a68f914baee | 98e51d2b2ce3d0c06bfb3dc914abd5dd36802135e3057280430b5c30b85feff4 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260412-005 |
| cl-20260412-006 | cce61b92e3141d39be0f849a014ffa11c23de86a2c7846653e0fbf5893443b12 | cce61b92e3141d39be0f849a014ffa11c23de86a2c7846653e0fbf5893443b12 | 447929671fce0d6f83701546ff42c010b256f0feb4458e65370a71ce91907b1d | cce61b92e3141d39be0f849a014ffa11c23de86a2c7846653e0fbf5893443b12 | cce61b92e3141d39be0f849a014ffa11c23de86a2c7846653e0fbf5893443b12 | e34bcb3af731e5a173cef44d40df905a65925dafeec4388d69d57d1a2f671893 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260412-006 |
| cl-20260412-007 | a68c6cc677df35e72db5bafaecc96b1336e98f292cfde15471c159f42bbdb23d | a68c6cc677df35e72db5bafaecc96b1336e98f292cfde15471c159f42bbdb23d | 6c13e616cc1a4a8aea1ea8862976ac45397dce0e12a538236aceeffd5ab5ad3e | a68c6cc677df35e72db5bafaecc96b1336e98f292cfde15471c159f42bbdb23d | a68c6cc677df35e72db5bafaecc96b1336e98f292cfde15471c159f42bbdb23d | ddce328f60c88d5e78d0eab0ca115779a0aee594980b711137e13e406ba4a6e7 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260412-007 |
| cl-20260412-008 | 929614b562c899c33a1b50559fe058d082b7287c812f221113216b489820aed6 | 929614b562c899c33a1b50559fe058d082b7287c812f221113216b489820aed6 | d8e2dd0a5e8d971659f8a78e8ad99887c761ab5de12c2384e810ce2bf2c0c3a4 | 929614b562c899c33a1b50559fe058d082b7287c812f221113216b489820aed6 | 929614b562c899c33a1b50559fe058d082b7287c812f221113216b489820aed6 | 0b599def01146e57f2900c7124b893e543f1ab5b3931ebd425505611d4dd0094 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260412-008 |
| cl-20260415-001 | 070df2956f6a7332c1c88d71f47855f638d9886079cf38f528c15c1556478174 | 070df2956f6a7332c1c88d71f47855f638d9886079cf38f528c15c1556478174 | 46dc5b28ba007a5149818ef0ae2f821d6c7e4914798caba845008dff8c8ddba5 | 070df2956f6a7332c1c88d71f47855f638d9886079cf38f528c15c1556478174 | 070df2956f6a7332c1c88d71f47855f638d9886079cf38f528c15c1556478174 | 21c8d839da7ea4afcb3cea289331848f6fd736f16ef47aa93911869e4a18fb73 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260415-001 |
| cl-20260416-001 | a2ff713e2aa3a4d770d8d8483910ec37ecedabda745ac684b0da0f80790f5805 | a2ff713e2aa3a4d770d8d8483910ec37ecedabda745ac684b0da0f80790f5805 | 2d4bf09be0d6fa2f939d9434e829a62e9fe1b0056d0de1133112a8d63cac6bf5 | a2ff713e2aa3a4d770d8d8483910ec37ecedabda745ac684b0da0f80790f5805 | a2ff713e2aa3a4d770d8d8483910ec37ecedabda745ac684b0da0f80790f5805 | d7b6f4cb72a42743b7b7b59f98f6e9d682aacf266285099e378c478e0e7c8886 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260416-001 |
| cl-20260416-002 | 65a003066b1652796d8bd5f5fba1a2fecaf138e82662669e48887671ee5182e7 | 65a003066b1652796d8bd5f5fba1a2fecaf138e82662669e48887671ee5182e7 | 83dcb9d35c34bc3a925b18738a529b21c85b491c518b76b1a65657f05b5223b3 | 65a003066b1652796d8bd5f5fba1a2fecaf138e82662669e48887671ee5182e7 | 65a003066b1652796d8bd5f5fba1a2fecaf138e82662669e48887671ee5182e7 | a09746b495f781fda7a32a738d4b8dfacef49f4dead27d54c50cdb402e62f475 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260416-002 |
| cl-20260417-001 | 945a84530fe4f83a9836e4532b5e098727fb59c547a5e4081f1d9f616e5ea97d | 945a84530fe4f83a9836e4532b5e098727fb59c547a5e4081f1d9f616e5ea97d | 48df28de2cb4c4db16f6ff0f70f3ffcec07ce504012ee4858e47f98f27b5e945 | 945a84530fe4f83a9836e4532b5e098727fb59c547a5e4081f1d9f616e5ea97d | 945a84530fe4f83a9836e4532b5e098727fb59c547a5e4081f1d9f616e5ea97d | 919cf04225a225743a2ee55412a5bad2a8189ea1834c06c486d79dd19cd6a45e | reviewed-substantive-collision | selected-reviewed-owner-union-for-substantive-collision | CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed contains a substantive same-ID variant across changes, createdAt, filesAffected, plan, problem, relatedRunIds, severity, summary, tags, title, updatedAt. Both variant hashes and the discarded seed-field set remain recorded, and no timestamp-based precedence was used. | owner-db, local-storage | applicable | The selected owner record is a direct Community Gallery adult-content gating change; the same-ID seed collision is separately disclosed in the migration receipt. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260417-001 |
| cl-20260417-002 | 5bea696413ce2f94f229d42c1f1ecf20462f01f7707241e1e56328bee1455709 | 5bea696413ce2f94f229d42c1f1ecf20462f01f7707241e1e56328bee1455709 | f686dcc70b05d159f3fc0d9c2fee4006b39badca5217504a3a7725fd7222735f | 5bea696413ce2f94f229d42c1f1ecf20462f01f7707241e1e56328bee1455709 | 5bea696413ce2f94f229d42c1f1ecf20462f01f7707241e1e56328bee1455709 | fcab5872dbcaa159c61af5667543f4060ce698a5e1382e07e28f1497e0efe52d | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record moves the Community Gallery feed selector and adult-content control into AppShellTopBar.tsx. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260417-002 |
| cl-20260417-003 | 4fa5295270e101a8fccbca221083268724d0b06ef32a16d84e5a6a40eb08206f | 4fa5295270e101a8fccbca221083268724d0b06ef32a16d84e5a6a40eb08206f | 0772c4738cde769a9e5ae8d1c4e3d59c7d3a651e417e46342369e8b25e49a2c8 | 4fa5295270e101a8fccbca221083268724d0b06ef32a16d84e5a6a40eb08206f | 4fa5295270e101a8fccbca221083268724d0b06ef32a16d84e5a6a40eb08206f | f080f61f50b287218002193625fcddf8317d0f40883524e90febc10aa6d708b6 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record moves guest-workspace protection into use-index-shell-bootstrap.ts, including the branch that returns signed-out users from protected Chronicle workspaces to Community Gallery. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260417-003 |
| cl-20260417-004 | 2c201f121bb19cd9ea678a4d1833cadeb20eee84969347d3c452d45ce7bbb28f | 2c201f121bb19cd9ea678a4d1833cadeb20eee84969347d3c452d45ce7bbb28f | 0e720caf66c114a67aec248d33dec3c271a333ef9c5c352b10b205838b2f7d61 | 2c201f121bb19cd9ea678a4d1833cadeb20eee84969347d3c452d45ce7bbb28f | 2c201f121bb19cd9ea678a4d1833cadeb20eee84969347d3c452d45ce7bbb28f | 75dc2dd69f2bc4e8ace7d60b8fd5008f3871857fa8f66a7567aecf4f22dc26ca | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260417-004 |
| cl-20260417-005 | 907e3b1b0ee3b610c1bc746bb8b9040232bf59383a35f0c20b5ead54e5188932 | 907e3b1b0ee3b610c1bc746bb8b9040232bf59383a35f0c20b5ead54e5188932 | 5c794a7fd4084b476972a4307bcc52d7da2d5e40bb5feffa181fd50516c3238e | 907e3b1b0ee3b610c1bc746bb8b9040232bf59383a35f0c20b5ead54e5188932 | 907e3b1b0ee3b610c1bc746bb8b9040232bf59383a35f0c20b5ead54e5188932 | 68716dc3d25e3d6c0016ffaf5d49f91efa63615e85187be2e6bf809bc85f8ee2 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record moves authentication-dialog state used when signed-out Gallery visitors attempt protected Like, Save, and Review actions. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260417-005 |
| cl-20260417-006 | 866c6220c9a6c330a0977e1d81e92b8d56272dc8924ae64497d4666a1b74c099 | 866c6220c9a6c330a0977e1d81e92b8d56272dc8924ae64497d4666a1b74c099 | ceff5dfa27a9d74f1568d67896a94cdd2983c3c319874197e5aad629f6b846a8 | 866c6220c9a6c330a0977e1d81e92b8d56272dc8924ae64497d4666a1b74c099 | 866c6220c9a6c330a0977e1d81e92b8d56272dc8924ae64497d4666a1b74c099 | a57a90028ab0a8813c35b028e63aacbbccbd0d2f460ad42fbabc1161d1286b74 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260417-006 |
| cl-20260417-007 | 03ef4d196b08920ffbddc97bd9662314a3e2b35e14c093040747e55e8e4ccf6c | 03ef4d196b08920ffbddc97bd9662314a3e2b35e14c093040747e55e8e4ccf6c | 0f85c14b5e11b6e48e054da330face3091e75d2ef459f1509ce376acb7a01b0b | 03ef4d196b08920ffbddc97bd9662314a3e2b35e14c093040747e55e8e4ccf6c | 03ef4d196b08920ffbddc97bd9662314a3e2b35e14c093040747e55e8e4ccf6c | 0b278e5508ea484c603dd0fc683c39422f80ecbccdd3edaa187acb392bbc87e3 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | applicable | The record moves Gallery Play and editable-copy handoffs into use-index-scenario-lifecycle.ts, the runtime owner that receives Community Gallery story selections. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260417-007 |
| cl-20260417-008 | d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1 | d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1 | d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1 | d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1 | d15ff02e939bbc73b623ae42c4342bdc452b527695f3c561e78f5ffcc99884e1 | 5afd72fd824605420208bb3287025f712cd4b9bad23c38d85ddd20253d22f738 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record directly changes Community Gallery adult-content gating for the toggle and masked story cards. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260417-008 |
| cl-20260418-001 | de27b3cb57a717a3759ba9d39708b01f5edeabd1fa58e4a205379a74fe5c4bc6 | de27b3cb57a717a3759ba9d39708b01f5edeabd1fa58e4a205379a74fe5c4bc6 | b6ad70a63131abd8fd4fd9557c81d4800376a2c34f3ac5705a3165cd94f03864 | de27b3cb57a717a3759ba9d39708b01f5edeabd1fa58e4a205379a74fe5c4bc6 | de27b3cb57a717a3759ba9d39708b01f5edeabd1fa58e4a205379a74fe5c4bc6 | 7d31019e1e8497c921c1bc6d55d869e1ea925645e6a99c839363e708f3808f02 | reviewed-substantive-collision | selected-reviewed-owner-union-for-substantive-collision | CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed contains a substantive same-ID variant across changes, createdAt, filesAffected, plan, problem, relatedRunIds, severity, summary, tags, title, updatedAt. Both variant hashes and the discarded seed-field set remain recorded, and no timestamp-based precedence was used. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-001 |
| cl-20260418-002 | 75b8f8578786720325a4c4b87e749db4a988707bd562d250a46293dbf7761970 | 75b8f8578786720325a4c4b87e749db4a988707bd562d250a46293dbf7761970 | fb028dc4d640152d4f8bfa3a1b0fab385e531d2dcb2fea2253838a3436d1de37 | 75b8f8578786720325a4c4b87e749db4a988707bd562d250a46293dbf7761970 | 75b8f8578786720325a4c4b87e749db4a988707bd562d250a46293dbf7761970 | 493a84cac2ba6cf641a31ba25d2c743c0a7fc54be720eaaed1a57fca990bc1c7 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-002 |
| cl-20260418-003 | c7cd52022677d89bef5056d81465739b111350279102c7993ab523c5c6076d64 | c7cd52022677d89bef5056d81465739b111350279102c7993ab523c5c6076d64 | 02103892b153e857e9127ba6c7f4bdfff933dad67697563affdaa3e5af9dedb8 | c7cd52022677d89bef5056d81465739b111350279102c7993ab523c5c6076d64 | c7cd52022677d89bef5056d81465739b111350279102c7993ab523c5c6076d64 | 8f7b3abdca3ff76309aa4cea9e4b583232621983290f074af9fe18489f66ba30 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-003 |
| cl-20260418-004 | 7bdb138131bf1e58c6a887f59c919e8e90e1491b0dd307028c31f56cc6bc663b | 7bdb138131bf1e58c6a887f59c919e8e90e1491b0dd307028c31f56cc6bc663b | d91debc46be8fa12e2f036454c0a5e45a8a5e25e2de58efc8f2b652b8d076b6b | 7bdb138131bf1e58c6a887f59c919e8e90e1491b0dd307028c31f56cc6bc663b | 7bdb138131bf1e58c6a887f59c919e8e90e1491b0dd307028c31f56cc6bc663b | 50e480645a2526c27773f4379bda61d0aa38fd3c6b9f7b3ccc72a99a35b089ca | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-004 |
| cl-20260418-005 | 2b75d76432366e2804031b711a405a5bdf4e5930db5501f9dcdd34ebe95db45d | 2b75d76432366e2804031b711a405a5bdf4e5930db5501f9dcdd34ebe95db45d | 8666070d4c371b494186ff8230065f190a01773f2d6a463426a9f9a45075bc38 | 2b75d76432366e2804031b711a405a5bdf4e5930db5501f9dcdd34ebe95db45d | 2b75d76432366e2804031b711a405a5bdf4e5930db5501f9dcdd34ebe95db45d | 13006a9d0e95ba562a9d6a90f7b492f253d88b6b5b909035660f39b0373f6b19 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-005 |
| cl-20260418-006 | 4138a830bb6ec6452815f119422dd834d7040c72dbe75e934a1509057a81ae04 | 4138a830bb6ec6452815f119422dd834d7040c72dbe75e934a1509057a81ae04 | a72e2ed956d1583e3237edc842ad890fda649874bffdb125f4ddf0bfe0691271 | 4138a830bb6ec6452815f119422dd834d7040c72dbe75e934a1509057a81ae04 | 4138a830bb6ec6452815f119422dd834d7040c72dbe75e934a1509057a81ae04 | 3ce1b0cd01d86633183ec801a200ce9e9923491b86cd5d1c076a72f82d426d36 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-006 |
| cl-20260418-007 | 10ed8277bd1ce76d2a9b635dc6e650ccc124f6a87d2a978a0f89b84727fc3b37 | 10ed8277bd1ce76d2a9b635dc6e650ccc124f6a87d2a978a0f89b84727fc3b37 | 79199fb9f19e0b3005a49f6218de06a46dc4483c350e2e85b5d17314d58cdc4c | 10ed8277bd1ce76d2a9b635dc6e650ccc124f6a87d2a978a0f89b84727fc3b37 | 10ed8277bd1ce76d2a9b635dc6e650ccc124f6a87d2a978a0f89b84727fc3b37 | eb7667c8e2ecb46d04e39c0903416a818302f909742e1002d09074cc8a937c1a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-007 |
| cl-20260418-008 | 9a744aae57021f391183a59245415362c780502458728f05eef93c586e93804e | 9a744aae57021f391183a59245415362c780502458728f05eef93c586e93804e | 5bbe34723966fb5f82a30f3304e7a64bc8c12529ec66c1e84ab86c231d7ef53c | 9a744aae57021f391183a59245415362c780502458728f05eef93c586e93804e | 9a744aae57021f391183a59245415362c780502458728f05eef93c586e93804e | 062928b96a457c4218791ae4b02fd45cf5d2ea3ba0063f2ead37695e1ab756d4 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-008 |
| cl-20260418-009 | c5922471a6f388135b92ebeef6e5bfc874bde12f69ab8fcc77ed7e1dd5849db6 | c5922471a6f388135b92ebeef6e5bfc874bde12f69ab8fcc77ed7e1dd5849db6 | 0c840adf266307dd1637f754063d025455f3afeb80ff3a48552aae7c2e11e7b3 | c5922471a6f388135b92ebeef6e5bfc874bde12f69ab8fcc77ed7e1dd5849db6 | c5922471a6f388135b92ebeef6e5bfc874bde12f69ab8fcc77ed7e1dd5849db6 | 24b07e6a84f2eefa76ddcc8235763f42496bdc1e7e00bde176f373a6ebca0fd2 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-009 |
| cl-20260418-010 | 35a2d3a3f35336221b479a614dfd158b198d7cdc953746e0f1e5ea7df51a4524 | 35a2d3a3f35336221b479a614dfd158b198d7cdc953746e0f1e5ea7df51a4524 | 8d8a56014970063456a99cf644d12f3062707d7e88e5e0f45e4a48fc3669231d | 35a2d3a3f35336221b479a614dfd158b198d7cdc953746e0f1e5ea7df51a4524 | 35a2d3a3f35336221b479a614dfd158b198d7cdc953746e0f1e5ea7df51a4524 | cead1b2b65cc2b72a5eb47dc489fba22847b55dfaa4351415ead7403fe3c3703 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-010 |
| cl-20260418-011 | dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f | dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f | dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f | dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f | dc95204b80755065d977a5a62a514295fd2ec5fd42250cfa44d089baa6ac3f5f | 0b360ea6e75b88c62732efa2324635ba0eebe1d628b8dfb7c9317e682544669b | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260418-011 |
| cl-20260419-001 | 54f79e939112201c8f89b98e6ddc89935a9edb4c0f5bb6affb38d393aaeeac50 | 54f79e939112201c8f89b98e6ddc89935a9edb4c0f5bb6affb38d393aaeeac50 | fef88e7422b838debc175fa467fa7d86e6ba0c0545718442ca4ec56d0512000f | 54f79e939112201c8f89b98e6ddc89935a9edb4c0f5bb6affb38d393aaeeac50 | 54f79e939112201c8f89b98e6ddc89935a9edb4c0f5bb6affb38d393aaeeac50 | 5fc59c1ff70a7305b9b15b4938d364ab755c7eee8bb503e496be2a619853ae91 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-001 |
| cl-20260419-002 | b430ef738c4a4690cd1594b3223a4ef778f3bc4f62a5c3ea3fb2568bad7d77e7 | b430ef738c4a4690cd1594b3223a4ef778f3bc4f62a5c3ea3fb2568bad7d77e7 | 120c6b51176e5694ae1b659858fe0988020510bf7f09243095975a242a52e9b3 | b430ef738c4a4690cd1594b3223a4ef778f3bc4f62a5c3ea3fb2568bad7d77e7 | b430ef738c4a4690cd1594b3223a4ef778f3bc4f62a5c3ea3fb2568bad7d77e7 | ff29d08c5783b05ff97b759616af55d277b76cfd11830f35b90dd494aa034209 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-002 |
| cl-20260419-003 | f08ecfed45a0fb9072f7b29587c2f4a7dbf47696ca1710e815cb9c78c1b2c3b8 | f08ecfed45a0fb9072f7b29587c2f4a7dbf47696ca1710e815cb9c78c1b2c3b8 | b272ad8afd4a8dfecdea8db19b8f29172d42a26dad6e5a068b11c649b8828cc1 | f08ecfed45a0fb9072f7b29587c2f4a7dbf47696ca1710e815cb9c78c1b2c3b8 | f08ecfed45a0fb9072f7b29587c2f4a7dbf47696ca1710e815cb9c78c1b2c3b8 | 9119b3ebd3c0786e4a6ebc09499395cfb5a97b6d6414be5e88f6f41dd750f64a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-003 |
| cl-20260419-004 | 4d07e8718b18e119b8324a2ca0fca127404247b6766a99cbfe6bf42ba64debd7 | 4d07e8718b18e119b8324a2ca0fca127404247b6766a99cbfe6bf42ba64debd7 | 7144dc68ae67f96885e116ea7cc5099fe0a5d6ff3cd1792967de398956d7ea14 | 4d07e8718b18e119b8324a2ca0fca127404247b6766a99cbfe6bf42ba64debd7 | 4d07e8718b18e119b8324a2ca0fca127404247b6766a99cbfe6bf42ba64debd7 | c896cbd840169fb30e5312529b1d0e3fa998a9efc037e171d35dc9923c9cdd75 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-004 |
| cl-20260419-005 | 494867ffc84390a1eb5816ed5bcee3cca46f271acceff5c791ab8ab23aaf7ac6 | 494867ffc84390a1eb5816ed5bcee3cca46f271acceff5c791ab8ab23aaf7ac6 | 9c33f8720d1dd9e7f5303152c187f83d817c29c32b5ea00efd2b0bb9d83e28a8 | 494867ffc84390a1eb5816ed5bcee3cca46f271acceff5c791ab8ab23aaf7ac6 | 494867ffc84390a1eb5816ed5bcee3cca46f271acceff5c791ab8ab23aaf7ac6 | 65e5cf99dcc89edf923413d76dfda5b3f5e5e9fbf23ca40040c8317dcaadf835 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-005 |
| cl-20260419-006 | a22c95adb79c31c5d91a2e1864f6bfaeea255594a1b122c393cba1f1dece0a8d | a22c95adb79c31c5d91a2e1864f6bfaeea255594a1b122c393cba1f1dece0a8d | ed290ef860e05b84405473a4244805bc24752fc1c6faf165e6ab9476304e1633 | a22c95adb79c31c5d91a2e1864f6bfaeea255594a1b122c393cba1f1dece0a8d | a22c95adb79c31c5d91a2e1864f6bfaeea255594a1b122c393cba1f1dece0a8d | e187b0169f74448bce19dacb4be920087e40a71ea78848cfcb16b51045a42d3c | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-006 |
| cl-20260419-007 | e8e8c2c8ea58a8b6eeb97a187c037a6df6ebf60d2d1688f8797bf80787d62d5f | e8e8c2c8ea58a8b6eeb97a187c037a6df6ebf60d2d1688f8797bf80787d62d5f | aa32d40fe5f18e33df79ea44c82591bd9ecb5c2f6368279c52c7ba7d37c6dfa9 | e8e8c2c8ea58a8b6eeb97a187c037a6df6ebf60d2d1688f8797bf80787d62d5f | e8e8c2c8ea58a8b6eeb97a187c037a6df6ebf60d2d1688f8797bf80787d62d5f | aa3923d930d3839fc8cb0064bc0b44907c183440a19f5be04f519b1f17eab336 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-007 |
| cl-20260419-008 | bd2e2511b54dda62469083928793638ee68a244445d863b1b5fcca17ff4e8c56 | bd2e2511b54dda62469083928793638ee68a244445d863b1b5fcca17ff4e8c56 | d6051f5752d8d386967c6c504b5df5a9e3912b157f87b06b6b6acd2cd29d604b | bd2e2511b54dda62469083928793638ee68a244445d863b1b5fcca17ff4e8c56 | bd2e2511b54dda62469083928793638ee68a244445d863b1b5fcca17ff4e8c56 | 7ae120610e1a84907a1797094ed6cd1a6cb0b08c3ea2dacb7870e6c2740e5b3e | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-008 |
| cl-20260419-009 | d74230b9b24650a93c046b9372e7dd3788d0ae5343485576525b7f8dc21c360f | d74230b9b24650a93c046b9372e7dd3788d0ae5343485576525b7f8dc21c360f | 114577ed640887e5d0a1e8d896ee3c84e02a451258a1e4ed0e58b416ecb2a149 | d74230b9b24650a93c046b9372e7dd3788d0ae5343485576525b7f8dc21c360f | d74230b9b24650a93c046b9372e7dd3788d0ae5343485576525b7f8dc21c360f | f3af1a1c4f584be33a22907f1616bc770e9d1751df8c3fa5c09f2a0225c84cc0 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-009 |
| cl-20260419-010 | 38b6106929d852da88644f1bc335119d75855f8db74b477be57a0c76aeeff6da | 38b6106929d852da88644f1bc335119d75855f8db74b477be57a0c76aeeff6da | 6b76e1643c483b4d1d3427b4efdffa506de3d06fb06631b8d0a0878d84db9df7 | 38b6106929d852da88644f1bc335119d75855f8db74b477be57a0c76aeeff6da | 38b6106929d852da88644f1bc335119d75855f8db74b477be57a0c76aeeff6da | dd4964ee3ba3acdab659083a4b73f8565055ce938ed5cd44aeef6a099c384c26 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-010 |
| cl-20260419-011 | 8e9b666de40cfca64bef67a58a915e315714d7cbd00f8b13620d4db1a29b9d06 | 8e9b666de40cfca64bef67a58a915e315714d7cbd00f8b13620d4db1a29b9d06 | 6ff8029efe88a70fadb0bcff8c423b0af24d3f000da89e6ed091ca4d11bce298 | 8e9b666de40cfca64bef67a58a915e315714d7cbd00f8b13620d4db1a29b9d06 | 8e9b666de40cfca64bef67a58a915e315714d7cbd00f8b13620d4db1a29b9d06 | add452e32bb3ff9a41e4775ff54fe23a091941aa0c974ae973373416f7da69f5 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-011 |
| cl-20260419-012 | 35a987193ce676e1289aba38cf439a27b702997b11fa6f6177397ee36a11fe05 | 35a987193ce676e1289aba38cf439a27b702997b11fa6f6177397ee36a11fe05 | 0d2ffd4330973a1409c2dc1f5c2a87e9755b899f3e5170708894cc77a3d59d44 | 35a987193ce676e1289aba38cf439a27b702997b11fa6f6177397ee36a11fe05 | 35a987193ce676e1289aba38cf439a27b702997b11fa6f6177397ee36a11fe05 | e809f745d778f9c6315218d04d5b93bdbed0124ddf7aefb3964cae88bab83c94 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260419-012 |
| cl-20260421-001 | 2d392195f5a692b8f251ea4b4410d2a896e664e3671bde60f41df3142cecdc2b | 2d392195f5a692b8f251ea4b4410d2a896e664e3671bde60f41df3142cecdc2b | 86c73570c479ae1c20e73a4256c9db72e56cb8e1e74783806b51abe63c99a3e5 | 2d392195f5a692b8f251ea4b4410d2a896e664e3671bde60f41df3142cecdc2b | 2d392195f5a692b8f251ea4b4410d2a896e664e3671bde60f41df3142cecdc2b | ca00c783c26cb51545d8de9262e08c5e4f5a4a4a1ae3dd0610b48da1f9a50488 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260421-001 |
| cl-20260421-002 | 4f8e12eb2e7366ff0a7b4b773a4fbc93c8be9a0c80731de66c0a0916ea18fed9 | 4f8e12eb2e7366ff0a7b4b773a4fbc93c8be9a0c80731de66c0a0916ea18fed9 | d82a151f93b97833e9d020eac944c843195f3299b598336e4eb67d68fb10ab8b | 4f8e12eb2e7366ff0a7b4b773a4fbc93c8be9a0c80731de66c0a0916ea18fed9 | 4f8e12eb2e7366ff0a7b4b773a4fbc93c8be9a0c80731de66c0a0916ea18fed9 | 69b673e5029597b8dd8ebde690e41b0f000ae128dac400c5eb83b94bdc34060b | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260421-002 |
| cl-20260421-003 | 88a2cf09c994e9f3f8eeac14e17af8dd96f65056d33d85f59d83879be3ae3a3a | 88a2cf09c994e9f3f8eeac14e17af8dd96f65056d33d85f59d83879be3ae3a3a | ac4998a2c4d2f067c239a911d24df788dc68b425c12e113b625b5d97f6e7053b | 88a2cf09c994e9f3f8eeac14e17af8dd96f65056d33d85f59d83879be3ae3a3a | 88a2cf09c994e9f3f8eeac14e17af8dd96f65056d33d85f59d83879be3ae3a3a | 69f9adfa097600810209c492303dc725786448df6731378905582d613cce6fca | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260421-003 |
| cl-20260422-001 | 6e454b1cd70169488fd1e7985389777d17d6f40869d70c7ba46dde48373aaa18 | 6e454b1cd70169488fd1e7985389777d17d6f40869d70c7ba46dde48373aaa18 | 69fe2803f403fa233845be23fff36016095accca67e9f4cacfb16495148d629d | 6e454b1cd70169488fd1e7985389777d17d6f40869d70c7ba46dde48373aaa18 | 6e454b1cd70169488fd1e7985389777d17d6f40869d70c7ba46dde48373aaa18 | 12b149f9910d4fe54f5f36fa77d2f8c4f79c390827a27d187f7a82d21eba4748 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260422-001 |
| cl-20260422-002 | 42da84965fbeb2743b394b4f3a255bab6a32e7cb1d3989b259d4e4b6efbea75e | 42da84965fbeb2743b394b4f3a255bab6a32e7cb1d3989b259d4e4b6efbea75e | 7fa7c855dab3fb54dd1426360281387f9a0b0fadbc3397c58acbd134a4710ba8 | 42da84965fbeb2743b394b4f3a255bab6a32e7cb1d3989b259d4e4b6efbea75e | 42da84965fbeb2743b394b4f3a255bab6a32e7cb1d3989b259d4e4b6efbea75e | e898d003811f89000f82014e82fe70984e33e4c3351b69a7ad462302645569d9 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260422-002 |
| cl-20260425-001 | b147471d7534f49c8ec586e4130f26ded63bd0c95a4f97246eb23e835a5b520d | b147471d7534f49c8ec586e4130f26ded63bd0c95a4f97246eb23e835a5b520d | 474c104230cade65816190a96c8ff34588bdda6e25273c75d881e720df405412 | b147471d7534f49c8ec586e4130f26ded63bd0c95a4f97246eb23e835a5b520d | b147471d7534f49c8ec586e4130f26ded63bd0c95a4f97246eb23e835a5b520d | ecaed0536fe6660d64441413b4f7c9fc76253b5d11d8a7dc09b99ea7243e34e1 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-001 |
| cl-20260425-002 | 6e46fad5040ae8bb50a01409b023905fb95af7fcd312d33dcdec9167206a528a | 6e46fad5040ae8bb50a01409b023905fb95af7fcd312d33dcdec9167206a528a | 600aea1f7fda7ca32c225a9bc0c4968b90497dc54c5486687a4e8e8b19f75be8 | 6e46fad5040ae8bb50a01409b023905fb95af7fcd312d33dcdec9167206a528a | 6e46fad5040ae8bb50a01409b023905fb95af7fcd312d33dcdec9167206a528a | cd579ba49fcf99e48d9b9898a0f5210a3855ee50e9e606b724e45d7d4d9f451a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-002 |
| cl-20260425-003 | 1b3abf1e3568932f98744002330fd798f25d5075c405ba92fd6d4d8740c0aa45 | 1b3abf1e3568932f98744002330fd798f25d5075c405ba92fd6d4d8740c0aa45 | 28f15c24646c655d11e3c8f4db6f98236c4e12922a488be997ad566ed205ab51 | 1b3abf1e3568932f98744002330fd798f25d5075c405ba92fd6d4d8740c0aa45 | 1b3abf1e3568932f98744002330fd798f25d5075c405ba92fd6d4d8740c0aa45 | ffbafa634ac139fbd3e94423b8a48c79962047c8ae9f5ac686b3c7c683bf26bc | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-003 |
| cl-20260425-004 | 6e3356b8852cdbda16d49ad14689edb24938047e58c6097d6a3b08f545b05f67 | 6e3356b8852cdbda16d49ad14689edb24938047e58c6097d6a3b08f545b05f67 | 7e147d9e0755167a9e54ae19bf00df615f8a257a49a0fed4db78ae6639ffedc7 | 6e3356b8852cdbda16d49ad14689edb24938047e58c6097d6a3b08f545b05f67 | 6e3356b8852cdbda16d49ad14689edb24938047e58c6097d6a3b08f545b05f67 | bb35bab908792ba34c88ab04cd36c4c616e6f7ffd537d3e10e78f6728758771e | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-004 |
| cl-20260425-005 | 4ead933d9840b5d0a62bd1dd34189efa599774e7b3e579c287e7e2401a2a2a9a | 4ead933d9840b5d0a62bd1dd34189efa599774e7b3e579c287e7e2401a2a2a9a | 9c5292a02de013a3daefaeb15f942a30bdd0f0f17c5fa80225253e1899c31031 | 4ead933d9840b5d0a62bd1dd34189efa599774e7b3e579c287e7e2401a2a2a9a | 4ead933d9840b5d0a62bd1dd34189efa599774e7b3e579c287e7e2401a2a2a9a | 89bca7ec507ed51b28e2dc3bdb80f76f734519c8e5bd0ee615c1d7387539075f | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-005 |
| cl-20260425-006 | 7b417225cac1d13e4599c9f75ee3a5f1255a158625acaea953b7389bc9fde904 | 7b417225cac1d13e4599c9f75ee3a5f1255a158625acaea953b7389bc9fde904 | 2c3c26efbb82a0a0d271b69987cfb29067f74a35fc64db10ed7084a77791f504 | 7b417225cac1d13e4599c9f75ee3a5f1255a158625acaea953b7389bc9fde904 | 08431520cc2085d00fa53381af6ed7c230bc3697509c415276181c000fa46dac | fad688b8da55d4ae6cf4790a63b44cfb2fe7c83f2ef776438f0f5d0957d505c1 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-006 |
| cl-20260425-007 | 3f0ffa0f069fa24fec27f2b5dae4c88b967a0cddf7985ee6f67c3bcb51f8d3f2 | 3f0ffa0f069fa24fec27f2b5dae4c88b967a0cddf7985ee6f67c3bcb51f8d3f2 | aa931fed059bb8ff425b1826456e43d711096d9b5953a8e2d18dda50c15713da | 3f0ffa0f069fa24fec27f2b5dae4c88b967a0cddf7985ee6f67c3bcb51f8d3f2 | 3f0ffa0f069fa24fec27f2b5dae4c88b967a0cddf7985ee6f67c3bcb51f8d3f2 | 4d0d0a73cad83f35e4d012ffb7c1ccae6eea928600428437bc976f2ead011ce9 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-007 |
| cl-20260425-008 | b475c0e878841b1be4d5c234071642fb7f849cbc255653f790e19aeae0d00dd5 | b475c0e878841b1be4d5c234071642fb7f849cbc255653f790e19aeae0d00dd5 | 4a57c8a8424cd7645319b3b5bdca0adb93fb8fba8070121d443d536d9f3c32db | b475c0e878841b1be4d5c234071642fb7f849cbc255653f790e19aeae0d00dd5 | b475c0e878841b1be4d5c234071642fb7f849cbc255653f790e19aeae0d00dd5 | 5c2d5cb01306b1787bbc06d2f4ba91f8a8b3da37b4e9ee4e05c280186aef7861 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-008 |
| cl-20260425-009 | 21ba161ab5ee28c2676ca699b499b251d9b360fc05c11e1403eccd900f751b7e | 21ba161ab5ee28c2676ca699b499b251d9b360fc05c11e1403eccd900f751b7e | d79ffc8910e52f1fbb7f60bfb9276c8133268f649f738c2bc27d8eacfbcd3d84 | 21ba161ab5ee28c2676ca699b499b251d9b360fc05c11e1403eccd900f751b7e | 87e5c6f981f346232024e07ce6cecf4b1d8fdcf105302bd5d3c24c159badc300 | 3c446966c5a20c35c481414bca2082c47d201e080861b6784f68f35c53fa4104 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-009 |
| cl-20260425-010 | 4daaeb01a3076e8baa9ca39fbda97bbfa6760c18f8ba5656b61d8666539c3a2b | 4daaeb01a3076e8baa9ca39fbda97bbfa6760c18f8ba5656b61d8666539c3a2b | 128e05afe09bb8176bb83ee70541fa5abe30c87f79fb0a6f4ba3e511c68df219 | 4daaeb01a3076e8baa9ca39fbda97bbfa6760c18f8ba5656b61d8666539c3a2b | 4daaeb01a3076e8baa9ca39fbda97bbfa6760c18f8ba5656b61d8666539c3a2b | e899517309e59210f06ab57d9e043e8b0de537bea68491cd7413a8cd9cdebb88 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-010 |
| cl-20260425-011 | dc0caf57929abec64c4af17dfa3b2df15df5f6069f9b595cd35134841b00499c | dc0caf57929abec64c4af17dfa3b2df15df5f6069f9b595cd35134841b00499c | 7f1d69240779f5a55a0540b144c2ec70bd2c80e48c3e17e2a42fa2a1190e78b8 | dc0caf57929abec64c4af17dfa3b2df15df5f6069f9b595cd35134841b00499c | 5e36b4cb8f4f30c0703cc59b042f5f41595c67ef50c7b5b26aa7438067d1b5f3 | 62c2975268cd7e05a9df62aa5134297e1d6dfd64d224c06d9f64a611d400678c | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-011 |
| cl-20260425-012 | 669953f5278f1c2f48898205473a0ff218d3c636738e07707b92625b51e93485 | 669953f5278f1c2f48898205473a0ff218d3c636738e07707b92625b51e93485 | 3d2bbe88863e6684f9ffbea743c6ec0abee3b2c0d489757b19b8e4274590ece6 | 669953f5278f1c2f48898205473a0ff218d3c636738e07707b92625b51e93485 | bd3c5e7cd23ed571ef3b2d7c2e008fe5c72483d1c5bb892c45229ed8ac69ff82 | 0c50c776326afb3f3682f6edfcfcedce7d120baeea749af47e42f0148e018d9b | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-012 |
| cl-20260425-013 | 97965ffb83e09711aed3cc0d7d5d2cfb36a941b5be0fe916c8bdab3a80779b21 | 97965ffb83e09711aed3cc0d7d5d2cfb36a941b5be0fe916c8bdab3a80779b21 | 86aa7f0e8189779a2dee70d6a453f7ad1aae46da2a9648601bcd4179ef732427 | 97965ffb83e09711aed3cc0d7d5d2cfb36a941b5be0fe916c8bdab3a80779b21 | ea325b76c14b72c7200eb9120adb726e1545c8b71099b5aaf6a43a928a1f9827 | 92d477250758798441aa036541893ab9a6bbcd304a282a6fca87b116d6a7c390 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-013 |
| cl-20260425-014 | e8bc3841d9d15bb20a168b19a419a12402de0ca73bf774bbe364292c799429d9 | e8bc3841d9d15bb20a168b19a419a12402de0ca73bf774bbe364292c799429d9 | d8ae7e8357e7a3beb89b132999ae6c4090ee6b5fee0d77f26b051541adf254e3 | e8bc3841d9d15bb20a168b19a419a12402de0ca73bf774bbe364292c799429d9 | 3e3d82121a40e3c7200455b870e4c780af8598b0ed4ad48c2b62f7bf9446d5ca | 0e2b654e4343714b76b37db08b13ad217d607551ee30288aaea26d12ea018e68 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-014 |
| cl-20260425-015 | 3f2f5ad41d7148013374c8d9250c61292a135a2fd4b358f18fccf5cdebf306da | 3f2f5ad41d7148013374c8d9250c61292a135a2fd4b358f18fccf5cdebf306da | 52f2e4900cc5939913ace7284b1c5ff293e0a28f0f57d3c4e872f515a7fa792a | 3f2f5ad41d7148013374c8d9250c61292a135a2fd4b358f18fccf5cdebf306da | b7478aadd59c087f01dad5abb71c5ddf0a34393845a9922adfcee13b458d6f30 | 1ec7a54052e0d11809865723174765eb43b89d3f82659ed363e73c241ecba615 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260425-015 |
| cl-20260426-001 | f652427887973c0336b98dadf1dc1101af261407a2aa714398669a9274969fb4 | f652427887973c0336b98dadf1dc1101af261407a2aa714398669a9274969fb4 | 0f4f1f2c27292c47b9369f006d0b1b72734621f746a7720ad871c1d2112ddc53 | f652427887973c0336b98dadf1dc1101af261407a2aa714398669a9274969fb4 | 90e9ea8a4d481396b5d14f8711316f48a69bf8cf860ac213269abddf30c221f9 | f79b62bdf69193a89b78a3e0db96c3cd8200efcbbb4ef68dc8318fc2c940d2af | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260426-001 |
| cl-20260426-002 | da6c130bf1719d1a7dd140ce8862c2da5abcb46d5bc02f088ead4b7eef949f49 | da6c130bf1719d1a7dd140ce8862c2da5abcb46d5bc02f088ead4b7eef949f49 | 076e0ceca7a28b3953f3e21f932f72cf6127313458be49f9a9beb83bfe6ee38f | da6c130bf1719d1a7dd140ce8862c2da5abcb46d5bc02f088ead4b7eef949f49 | da6c130bf1719d1a7dd140ce8862c2da5abcb46d5bc02f088ead4b7eef949f49 | bc1aa3a1be23d24b7b0e5de179128691c01c1960b530b5ffb13c85be1f870334 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260426-002 |
| cl-20260426-003 | 4eed72337066478b8b32a9b96672ff9761af7a539171167d91a2e2d0df020c7a | 4eed72337066478b8b32a9b96672ff9761af7a539171167d91a2e2d0df020c7a | 5216b79422594a04fb3193d0624e31685d58e8dee6fa3a65bd671889e8c5cb06 | 4eed72337066478b8b32a9b96672ff9761af7a539171167d91a2e2d0df020c7a | 4eed72337066478b8b32a9b96672ff9761af7a539171167d91a2e2d0df020c7a | 72ca614bb275149a11a2613f54f3d46f7a4bc966d5d9cc8357e6d5d65125c3bc | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260426-003 |
| cl-20260426-004 | a0bef1cc93c182bc586ba063a79fd50d9df933abaf02f5c8b720ac7ade1a56cd | a0bef1cc93c182bc586ba063a79fd50d9df933abaf02f5c8b720ac7ade1a56cd | 950054e7242b80f266948459ec7381268260203a38883236ed832c7d18419781 | a0bef1cc93c182bc586ba063a79fd50d9df933abaf02f5c8b720ac7ade1a56cd | e21c809a2abae42636c09ed5ba2d01c72922e539a823f17d8c30d4b0b2711456 | bc0d4228c218cc7c8cdcdc09a1b0d5cd94cffb1efdf232b28c1db41ef39838cb | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260426-004 |
| cl-20260426-005 | 7e198bf51c59cbcc9d4354286a11e2c7a910a6eeffc40982bc788487cb3e9cc7 | 7e198bf51c59cbcc9d4354286a11e2c7a910a6eeffc40982bc788487cb3e9cc7 | 81a44ae8e7897f7930806db9af1f886215f756f10c242aa3559f37f82226ffc1 | 7e198bf51c59cbcc9d4354286a11e2c7a910a6eeffc40982bc788487cb3e9cc7 | 7e198bf51c59cbcc9d4354286a11e2c7a910a6eeffc40982bc788487cb3e9cc7 | adca586191c5189ec621e8f44efc32bcaae1963904deb5c972f2e13ce674f547 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260426-005 |
| cl-20260426-006 | e4e74251e121a25c2148b2727cf8f6286023cfefbd0c74d49652d621bf622599 | e4e74251e121a25c2148b2727cf8f6286023cfefbd0c74d49652d621bf622599 | 4d4b7a2ece5d3e2473eb7d714078fb5ef22356208e4928959f179f8e26d6337e | e4e74251e121a25c2148b2727cf8f6286023cfefbd0c74d49652d621bf622599 | e4e74251e121a25c2148b2727cf8f6286023cfefbd0c74d49652d621bf622599 | 9e09603744f035b0d30059427e91c442b261d2c94aec6d21ebac5da8489e790a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260426-006 |
| cl-20260430-001 | 5e31e4a0e72e5faa1b71c0cc09160d54f7679d8d8bfc066faa418f7800981db3 | 5e31e4a0e72e5faa1b71c0cc09160d54f7679d8d8bfc066faa418f7800981db3 | 12115cbb8326e85cd8665b510c93dc09e934a30b533cd7f427eca2f5888f536f | 5e31e4a0e72e5faa1b71c0cc09160d54f7679d8d8bfc066faa418f7800981db3 | dab796857c4ca0dd361f8de80bac33db8db9598a87d05bb82b273b770190ad3c | 063a7689b246866ad2c13ce7ab21c1cb7fc0cc178a73066953745f16ae9a005d | reviewed-substantive-collision | selected-reviewed-owner-union-for-substantive-collision | CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed contains a substantive same-ID variant across changes, createdAt, filesAffected, plan, problem, relatedRunIds, severity, summary, tags, title, updatedAt. Both variant hashes and the discarded seed-field set remain recorded, and no timestamp-based precedence was used. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260430-001 |
| cl-20260430-002 | cd1f35e53ac9eb6b593fcd8d16fe972cb43555ef7b7807be29f4a7c14d1899e6 | cd1f35e53ac9eb6b593fcd8d16fe972cb43555ef7b7807be29f4a7c14d1899e6 | 83277bcb16cd5591173708d75f911083e4890c4b5d824be7faa797eecb692ab7 | cd1f35e53ac9eb6b593fcd8d16fe972cb43555ef7b7807be29f4a7c14d1899e6 | 91c865de0e071e4d2203f120c6036b90eeb8eb5c76efd424cc8c095bdb0e1a73 | a18f61d4d4d50644243e8c8c963a06993a5825963535712a506b17d3add44560 | reviewed-reference-difference | selected-reviewed-owner-union-for-reference-difference | CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed differs only in relatedFindingIds, relatedRunIds. All variant hashes and differing fields remain recorded without timestamp-based precedence. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260430-002 |
| cl-20260430-003 | 62f42936a16c9658e732783b53a237f0d4b3f42c6ecd21069967a64c16189e4e | 62f42936a16c9658e732783b53a237f0d4b3f42c6ecd21069967a64c16189e4e | 62f42936a16c9658e732783b53a237f0d4b3f42c6ecd21069967a64c16189e4e | 62f42936a16c9658e732783b53a237f0d4b3f42c6ecd21069967a64c16189e4e | 0b33a397b9ee1663b7e9efed905d6ed6cc6e226e1943bd84c0731ab3cc1ee997 | 222af4be2fde75793fb39ad32025810d79c376d088d03b3d18d2d14019cb69ce | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260430-003 |
| cl-20260501-001 | a2195cc5685aafc305edcd39a79e28ad34632e95829c6a8d852ffc37a66a3ed8 | a2195cc5685aafc305edcd39a79e28ad34632e95829c6a8d852ffc37a66a3ed8 | 6308b2533095416f25b2b2b169a0d485b745dd541b59684d8a93c028edb6d9ea | a2195cc5685aafc305edcd39a79e28ad34632e95829c6a8d852ffc37a66a3ed8 | 19088d6c4d6522d0a68e2762d48e43555bfeaa88c8d85d8e51b18687d0eccafa | 16562c2623079838b86b7e3d692835dc8c78c3dbdf6895bde7b1f7bb472ca50c | reviewed-reference-difference | selected-reviewed-owner-union-for-reference-difference | CG-LOG-022 selects the exact owner union. Owner and local storage are identical; the seed differs only in relatedFindingIds, relatedRunIds. All variant hashes and differing fields remain recorded without timestamp-based precedence. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260501-001 |
| cl-20260501-002 | b7e50fe062879486221c0b5b33f0f00ff71b57f5d5457ed506c3da614819a4ad | b7e50fe062879486221c0b5b33f0f00ff71b57f5d5457ed506c3da614819a4ad | 60ecbf43e05954b2d42d63bb68eaec7b977ef866f2a2afe68516d192c29f9acc | b7e50fe062879486221c0b5b33f0f00ff71b57f5d5457ed506c3da614819a4ad | 7eb1d4f7d2544af021458a38d4c530632c24a32288e2e4eea2463b4a47d4e7e1 | 10412eec30285b49bc96443789ba83991e3fc6069982969b0d7f2110fc321a20 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260501-002 |
| cl-20260501-003 | ee7626051f5277e2deb6af91cbb5f1feed1efbbc42fa42e7f54f7097eda76157 | ee7626051f5277e2deb6af91cbb5f1feed1efbbc42fa42e7f54f7097eda76157 | 1fac75f4e78d6a0ba43a340a838190b3612a64f919ec907001e54e8d07031536 | ee7626051f5277e2deb6af91cbb5f1feed1efbbc42fa42e7f54f7097eda76157 | f5b29fab4c23c9457db5acf5aae512587258ec1204f677157426dab8fdbb8ddd | 276086643b0fa7d3ce4e99574eee101c7ebc567b6427a9bbbd786fa6065463a1 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260501-003 |
| cl-20260501-004 | 5cfcf23b123ed784be04a1f146e2bfc7e59141e11afef66cef622677db410865 | 5cfcf23b123ed784be04a1f146e2bfc7e59141e11afef66cef622677db410865 | e37125690f08a154044a6384cc3b55aefd762aa4b747bfd9b35290c1735e9996 | 5cfcf23b123ed784be04a1f146e2bfc7e59141e11afef66cef622677db410865 | 7bd261c345147f5b9b695d7ee56245808f3d080a8ad0c949d6d1666023428170 | 5875c74871c177705487c8fe8032c2d8fa8a90e570351c94b02041116b4a54f1 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260501-004 |
| cl-20260501-005 | 2c487f51277c504892791c5c9d2c80e94f76d2afb39e80929c2c2f41ee0317fb | 2c487f51277c504892791c5c9d2c80e94f76d2afb39e80929c2c2f41ee0317fb | 6928076c6547e5862e632329c8433923815c4bfb27a0e60d74a6f28bcb8eaae0 | 2c487f51277c504892791c5c9d2c80e94f76d2afb39e80929c2c2f41ee0317fb | 51269603cbe76f0dcc2354d248371096805ee03d7aa2b9f7af8bfa863eb31e56 | e2f480c84e1face4f63e4cb174253eba04e5ce5663a4ee36b066f9fdcd3ba2c2 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260501-005 |
| cl-20260501-006 | e5789fc9830ff3130873e1d7acb830c545d9832eb6400435e71045fbdf3027fc | e5789fc9830ff3130873e1d7acb830c545d9832eb6400435e71045fbdf3027fc | 03eb3eed314158f684dde5124b79fcbc020c98fdea9b26e8777d05a36bf5743f | e5789fc9830ff3130873e1d7acb830c545d9832eb6400435e71045fbdf3027fc | d994ac7946072eb10ca9fe9c386d0ad704a59f12b295ca9e1bafcc54da3ee69d | 2422a1ec14f74cc60465d883db2c855f61205ff2bcb15d75112dd3a951a5f122 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260501-006 |
| cl-20260502-001 | f4b1365137e583ec8dbbd094ca35d312a9049d788e1ad262d0c2b20268ae5b0b | f4b1365137e583ec8dbbd094ca35d312a9049d788e1ad262d0c2b20268ae5b0b | 4790e46d82a899951345eb3ded4e4679ce545e3a50906bb437abdafb06fe8318 | f4b1365137e583ec8dbbd094ca35d312a9049d788e1ad262d0c2b20268ae5b0b | f4b1365137e583ec8dbbd094ca35d312a9049d788e1ad262d0c2b20268ae5b0b | 84a43a758050ba749e58884330969176fd6088233154c17b928eb9f30cf6d932 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260502-001 |
| cl-20260506-001 | 53beb25304c1eafb1846bfd348b44b0ab7fc4ba296961d1a19665704bf818cc0 | 53beb25304c1eafb1846bfd348b44b0ab7fc4ba296961d1a19665704bf818cc0 | 11d0df88d177453093372702db51f32bf968d6a9128ef03520fbfdf414aead05 | 53beb25304c1eafb1846bfd348b44b0ab7fc4ba296961d1a19665704bf818cc0 | 53beb25304c1eafb1846bfd348b44b0ab7fc4ba296961d1a19665704bf818cc0 | a2ebf627fc7edd8c54cf2516e300a2c9213096211f9fafe7bd3dbd8a18c3772a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260506-001 |
| cl-20260507-001 | 97bc835a375be42ca36a966490e4bef808c052216a7ee86f69055f3ddd43f73c | 97bc835a375be42ca36a966490e4bef808c052216a7ee86f69055f3ddd43f73c | b3c89be81bf437d4da62d271c1a9bb4410d4de0df28337674f82d385588d8bd4 | 97bc835a375be42ca36a966490e4bef808c052216a7ee86f69055f3ddd43f73c | 97bc835a375be42ca36a966490e4bef808c052216a7ee86f69055f3ddd43f73c | 142e845615425a0f792a33c90153c9bbe0eea61ca03c16507e278afc1fe3d941 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260507-001 |
| cl-20260509-001 | 75fbb6a3eb0a82b3c3d18304533c1ecf1ef82d4467afbc800aad60f8441530df | 75fbb6a3eb0a82b3c3d18304533c1ecf1ef82d4467afbc800aad60f8441530df | 72c6e21ee9dab6b53518aeeb236cfd275e49ccc96cc0cfe69d8b773b43acbfc7 | 75fbb6a3eb0a82b3c3d18304533c1ecf1ef82d4467afbc800aad60f8441530df | 75fbb6a3eb0a82b3c3d18304533c1ecf1ef82d4467afbc800aad60f8441530df | bd58ec5c275afc0f7a20c7766c842780ca9a11b0ca340f5a02f0abb5f99d27d3 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260509-001 |
| cl-20260509-002 | 5cf28d896cbcba4f1d1462a249e8e891ab380fb0a1187eb57895e7e27e1566f9 | 5cf28d896cbcba4f1d1462a249e8e891ab380fb0a1187eb57895e7e27e1566f9 | ee0b47cfa041ec0c2c8c6401ccf597dca8dc96bed6d154c5956f873d74f2f09c | 5cf28d896cbcba4f1d1462a249e8e891ab380fb0a1187eb57895e7e27e1566f9 | 5cf28d896cbcba4f1d1462a249e8e891ab380fb0a1187eb57895e7e27e1566f9 | 70e07c83f54cd70b2d35e98840d73b5074e5e6cbf69a0c3a3beb6cb41c87f4e0 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260509-002 |
| cl-20260509-003 | 0bcb603f93294938880b94075270000874b531572252629ed1c1338b2a05043f | 0bcb603f93294938880b94075270000874b531572252629ed1c1338b2a05043f | 26823f0a83cb22e0d25ff68f10b41bb940d596619392f9b161c8b47cf41db4bf | 0bcb603f93294938880b94075270000874b531572252629ed1c1338b2a05043f | 0bcb603f93294938880b94075270000874b531572252629ed1c1338b2a05043f | 770f979abe1c0bfefc784c64bf2a992951959427f009174d24c0a8e4e963d9af | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260509-003 |
| cl-20260510-001 | 39a146e4634157a2c5a514d16b6670d889b439f3bd83a2f1a8ba86cbf2d31d6c | 39a146e4634157a2c5a514d16b6670d889b439f3bd83a2f1a8ba86cbf2d31d6c | 8a371b08554f3720b4522cc4b2f166715068148d4eee9d9f7b7578b450f8d390 | 39a146e4634157a2c5a514d16b6670d889b439f3bd83a2f1a8ba86cbf2d31d6c | 39a146e4634157a2c5a514d16b6670d889b439f3bd83a2f1a8ba86cbf2d31d6c | f602a2cf93f01c237013ae26e92194fa427b860b989440ee5d2f940714c33c59 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260510-001 |
| cl-20260510-002 | 974aa568a5df203c179ba119b5158332c41e060fb3603299748a9cce38a8f58c | 974aa568a5df203c179ba119b5158332c41e060fb3603299748a9cce38a8f58c | d0f52381459950a431a8369a74e3852354d8c7e6de798f4aa7782fb89f067577 | 974aa568a5df203c179ba119b5158332c41e060fb3603299748a9cce38a8f58c | 974aa568a5df203c179ba119b5158332c41e060fb3603299748a9cce38a8f58c | e0f6af02da1fddc8c0e475d088d583179fef038c146119189f9919c44331f8bc | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260510-002 |
| cl-20260514-001 | 90d3aba8c8315f679c7cb0808c1cdf16b9a38ff37f16f2388ad5049b00a851fc | 90d3aba8c8315f679c7cb0808c1cdf16b9a38ff37f16f2388ad5049b00a851fc | 31593814dc131b7f0e24b6e365d25943765fa4e91f885a6fc890cb6b3faa3798 | 90d3aba8c8315f679c7cb0808c1cdf16b9a38ff37f16f2388ad5049b00a851fc | 90d3aba8c8315f679c7cb0808c1cdf16b9a38ff37f16f2388ad5049b00a851fc | eb630ea2e502381da838b3264fa3aeeb4e0806e4f383a0b194882277bbc92e78 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260514-001 |
| cl-20260514-002 | f296054986097ca12f40cee8a1908d50a715d6191b2803b785eadadf40e1f68c | f296054986097ca12f40cee8a1908d50a715d6191b2803b785eadadf40e1f68c | 838a3ae095e1c5eeb210b443973a6426d08eb962a726e337808c560f6e1b6559 | f296054986097ca12f40cee8a1908d50a715d6191b2803b785eadadf40e1f68c | f296054986097ca12f40cee8a1908d50a715d6191b2803b785eadadf40e1f68c | 26732483341ba64e8f70fe940b66b457befb4d8dbd7408afc53d4baf3108e00b | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260514-002 |
| cl-20260515-001 | ee838df5ab4875f923e471d287df6f79c872a5443924101df3c6b84453eb8054 | ee838df5ab4875f923e471d287df6f79c872a5443924101df3c6b84453eb8054 | c2656451b2a9fd401e23e4b3fd6cb2d0cdebb19d7aaecfb5688e3eb403980c21 | ee838df5ab4875f923e471d287df6f79c872a5443924101df3c6b84453eb8054 | ee838df5ab4875f923e471d287df6f79c872a5443924101df3c6b84453eb8054 | f839520bd18e0b5c642c0a6723c5313386be42ec1b2bfd77670eafddd53155bc | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260515-001 |
| cl-20260516-001 | c6d0a03157e4ea6dfa055724d6dfdbdd451f3ea5f1127000c8a4211444332864 | c6d0a03157e4ea6dfa055724d6dfdbdd451f3ea5f1127000c8a4211444332864 | 94f1b4855c484821555e7ff058c7847f4f940864e543c06cfc02d54cedca00f7 | c6d0a03157e4ea6dfa055724d6dfdbdd451f3ea5f1127000c8a4211444332864 | c6d0a03157e4ea6dfa055724d6dfdbdd451f3ea5f1127000c8a4211444332864 | 730cd695bc4c6b433732ac0d9bfda74852c2fe064e81b1f702126ec574395450 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260516-001 |
| cl-20260516-002 | 3bbc7085e1794fb3366a2e971fd81021cc49a78a7256a240554f1b64b9106794 | 3bbc7085e1794fb3366a2e971fd81021cc49a78a7256a240554f1b64b9106794 | 08023c017abde606f90db9d408dfbde55515141836186170378c99174182ff04 | 3bbc7085e1794fb3366a2e971fd81021cc49a78a7256a240554f1b64b9106794 | 3bbc7085e1794fb3366a2e971fd81021cc49a78a7256a240554f1b64b9106794 | 63d2062c63eb132778a75e9c9d2124df9e6a5b815e997dbfecb1a0a99726c9a9 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260516-002 |
| cl-20260516-003 | 78232fa9d569b16074f735386cc045ab3a2c5d2e60f3ae1fa244e71e8ee6a0fc | 78232fa9d569b16074f735386cc045ab3a2c5d2e60f3ae1fa244e71e8ee6a0fc | 4cebfafeec9a366f5bf6461b45b689b5681ef4998d6faf28a296327b4fd9697d | 78232fa9d569b16074f735386cc045ab3a2c5d2e60f3ae1fa244e71e8ee6a0fc | 78232fa9d569b16074f735386cc045ab3a2c5d2e60f3ae1fa244e71e8ee6a0fc | 3423937aca200d52eac8c5d34672cc5d2ebcc6c45fc5d15348ccf301c5e86dff | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260516-003 |
| cl-20260516-004 | 8b1920a12cbe2d3fb62f5800410c4fb2e7205a8d5b828d1a892c4e88aeaa7efa | 8b1920a12cbe2d3fb62f5800410c4fb2e7205a8d5b828d1a892c4e88aeaa7efa | 029c0b211626582ee6ff77aaabec7053f4d07f76f12e05643f0972b794f0db90 | 8b1920a12cbe2d3fb62f5800410c4fb2e7205a8d5b828d1a892c4e88aeaa7efa | 7464cad056bc185629b8cb1f59e30223535bdd0fb02e810e319dcb05bfe16365 | c29cf534d01de67e1268c57502a9f4eb5e4f6ad3d3bbb052ce8915b1b136b02f | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260516-004 |
| cl-20260517-001 | b9d65c73013d9ffa0c326089dcf5d1610f2392e225edf6294304af1c7ff9ff64 | b9d65c73013d9ffa0c326089dcf5d1610f2392e225edf6294304af1c7ff9ff64 | 94e231fdf0350dace000c26d3db592a9553ff1dfa34957c3d7d11487742db2c3 | b9d65c73013d9ffa0c326089dcf5d1610f2392e225edf6294304af1c7ff9ff64 | b9d65c73013d9ffa0c326089dcf5d1610f2392e225edf6294304af1c7ff9ff64 | 93fdf2e748ed69755e85422cc9e03caa75b42dc7af9e9e997ab6a35b3cc524c8 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260517-001 |
| cl-20260520-001 | 971ceaea834907fbacbf4fe99364688670845b949b2b7f0733e39eee79814dd4 | 971ceaea834907fbacbf4fe99364688670845b949b2b7f0733e39eee79814dd4 | 0dd39efe1732597ac7e2f2caf1fff69669a50b32b2cb6306577862abe79cc7c4 | 971ceaea834907fbacbf4fe99364688670845b949b2b7f0733e39eee79814dd4 | 971ceaea834907fbacbf4fe99364688670845b949b2b7f0733e39eee79814dd4 | 8659a4933601fc67633f03c86d84230c0c585709b42205526abd14cc6c483a01 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260520-001 |
| cl-20260521-001 | bb760ea0a007f1244c9611ddc4c7cdfda80ce5bf6799c73f8b6912b888029dfd | bb760ea0a007f1244c9611ddc4c7cdfda80ce5bf6799c73f8b6912b888029dfd | a1cae7f32e0d99b17b6aa8c564c9ac1b26c2ca49279d45766e5e5de1aca9eec8 | bb760ea0a007f1244c9611ddc4c7cdfda80ce5bf6799c73f8b6912b888029dfd | bb760ea0a007f1244c9611ddc4c7cdfda80ce5bf6799c73f8b6912b888029dfd | 0f8cee6d599602e703f329d046f2d167d760dc59d19c8d73be6be71a4a52c09a | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260521-001 |
| cl-20260521-002 | 087e6d494637fd8a3713a4d43f63d11ec0d25f6a059874d40e7d44ab620d2d46 | 087e6d494637fd8a3713a4d43f63d11ec0d25f6a059874d40e7d44ab620d2d46 | 1f2c2aa7b0a43127597e8c99a76adec9d066f0aa84b77df8cf2d255bb9bf2cc4 | 087e6d494637fd8a3713a4d43f63d11ec0d25f6a059874d40e7d44ab620d2d46 | 087e6d494637fd8a3713a4d43f63d11ec0d25f6a059874d40e7d44ab620d2d46 | 214be5b78818663ffea2a7bb0641d47952f5578d85d81a821789869a93f641c8 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260521-002 |
| cl-20260521-003 | 7e09448efaaf74ed6d2fa9c773380826cd6762e5af2517d7963a44a22048bccd | 7e09448efaaf74ed6d2fa9c773380826cd6762e5af2517d7963a44a22048bccd | 4996e06bdf260fe9f106c9881b74b113c8790b2700099a4ba579a8f1f1f5875a | 7e09448efaaf74ed6d2fa9c773380826cd6762e5af2517d7963a44a22048bccd | 7e09448efaaf74ed6d2fa9c773380826cd6762e5af2517d7963a44a22048bccd | 27e89ed2a47e3793a20687ee1d1c9f871a76e70a0e15afa7ade011836f823780 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260521-003 |
| cl-20260523-001 | f4dd1b064a861005992d243bc320d4f0af0d87e1ba6ce41a0f4c89731934bf85 | f4dd1b064a861005992d243bc320d4f0af0d87e1ba6ce41a0f4c89731934bf85 | e4ba5da38b9d0010a9993088f7c1a5176bd117ccc7796bc715498a768ad585d2 | f4dd1b064a861005992d243bc320d4f0af0d87e1ba6ce41a0f4c89731934bf85 | f4dd1b064a861005992d243bc320d4f0af0d87e1ba6ce41a0f4c89731934bf85 | a6457571303014b5e65acf8c83125b938d4f55a735d1350968a7d904dfbd891e | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260523-001 |
| cl-20260523-002 | 0bce0d1fb41993adb62f67748fb70ce41afb0ba3f1100939d6e2f5f9a823dc4b | 0bce0d1fb41993adb62f67748fb70ce41afb0ba3f1100939d6e2f5f9a823dc4b | d8169a597398d0d0c36052de90330f33e53f8f13c93389f2fa27f6e06b6fa1d3 | 0bce0d1fb41993adb62f67748fb70ce41afb0ba3f1100939d6e2f5f9a823dc4b | 0bce0d1fb41993adb62f67748fb70ce41afb0ba3f1100939d6e2f5f9a823dc4b | dfc4c7f8d83303efea1650a0781ced403da1d42dbfccb5903a52ace29a237f8b | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260523-002 |
| cl-20260524-001 | 8a4c4b547b8dd9ce3ad601f96fdfc8f66888edfc22941193531663d5a17040d6 | 8a4c4b547b8dd9ce3ad601f96fdfc8f66888edfc22941193531663d5a17040d6 | d0b161dd24130cf8fc3b5efe7d8cbac04a5ae1e7c1bcd951ee4398fcfb556ab6 | 8a4c4b547b8dd9ce3ad601f96fdfc8f66888edfc22941193531663d5a17040d6 | 8a4c4b547b8dd9ce3ad601f96fdfc8f66888edfc22941193531663d5a17040d6 | d88a476ef34ad1040fd7781f386534c4c553bd0a9b0c8bbf808321e849bb2b6f | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260524-001 |
| cl-20260528-001 | 6f869641ee6317bea6443998bcae7bed3db63ce5872b6e917edf1eea460d957d | 6f869641ee6317bea6443998bcae7bed3db63ce5872b6e917edf1eea460d957d | dc607e94aed3e316ce201711c120c982c28715092f0c95465032be2a5a5e3449 | 6f869641ee6317bea6443998bcae7bed3db63ce5872b6e917edf1eea460d957d | 6f869641ee6317bea6443998bcae7bed3db63ce5872b6e917edf1eea460d957d | 6d0deab38d663d8d2d87e9843634d37703aab68e7001af252c68d86c31aa614d | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260528-001 |
| cl-20260529-001 | e8684f78dd402a92ee6656784556c0391c226775e7fbe896fa4fcfa6cc8d9cec | e8684f78dd402a92ee6656784556c0391c226775e7fbe896fa4fcfa6cc8d9cec | f9a5e2c883b87ffa675d5e38fbcc9c6421f37da5adf63afdf317e6165532da4b | e8684f78dd402a92ee6656784556c0391c226775e7fbe896fa4fcfa6cc8d9cec | e8684f78dd402a92ee6656784556c0391c226775e7fbe896fa4fcfa6cc8d9cec | 074aaafb00af161e9cbc860b6cd300eedcda43f1a3a95f875c198f705e899671 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260529-001 |
| cl-20260529-002 | ebbb5e0967d7aad8a303ffa8913331179576a5df7045d08ff36ecb659ae51e9f | ebbb5e0967d7aad8a303ffa8913331179576a5df7045d08ff36ecb659ae51e9f | 5dac244c77fb1a9f0febd2c12e0ab4f16a02cb89529029490a2cb52f5f188a79 | ebbb5e0967d7aad8a303ffa8913331179576a5df7045d08ff36ecb659ae51e9f | ebbb5e0967d7aad8a303ffa8913331179576a5df7045d08ff36ecb659ae51e9f | 455509b2fb93a24417f538e5fcdd65b94e3fa3d1f441c1fd62a18c9753113bed | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260529-002 |
| cl-20260529-003 | 0decf027a756b2089ad20d75265e37b5f7c51992763b6feb753a6fdb0621d126 | 0decf027a756b2089ad20d75265e37b5f7c51992763b6feb753a6fdb0621d126 | fff265183ea9981542d4a16d0f6a11fdcf090a99fb068b20c18e0d6fab950f7e | 0decf027a756b2089ad20d75265e37b5f7c51992763b6feb753a6fdb0621d126 | 0decf027a756b2089ad20d75265e37b5f7c51992763b6feb753a6fdb0621d126 | d117031162acc464c7137940ac117f3def1b4483078f25ee3b8d704564fcd966 | normalized-empty-optional-field | normalized-optional-empty-array-under-reviewed-owner-union | CG-LOG-022 selects the exact owner union. Owner and local storage explicitly preserve an empty optional relatedRunIds array; the seed omission is retained as comparison evidence and treated as the same empty meaning, not exact lineage. | owner-db, local-storage | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260529-003 |
| cl-20260530-001 | fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2 | fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2 | fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2 | fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2 | fb43c409d04c43cbd8197f32920d39482958e41b344cea813ad288033e1e3bb2 | e1de31d447d3dbae551d0b5892946483a0f8bd3a8fc8bce7c8224ea34e266d43 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260530-001 |
| cl-20260607-001 | b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d | b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d | b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d | b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d | b6b0fee90013d08542ab20ecd73b3016db40793477b9a70738ff85dd0f623a7d | 7850369c5e7e7e5c826c3b9b7430be260381a5ff69d1322128ce64bae4c34405 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260607-001 |
| cl-20260607-002 | e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450 | e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450 | e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450 | e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450 | e19d0026575507090192de6fb1f444db74c69196c8832b39f3fc3912c62c1450 | 4c498656826d2d5a20e572526c6554c3f2b7d34773c0d71e176b6ec8006c078d | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260607-002 |
| cl-20260607-003 | 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27 | 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27 | 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27 | 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27 | 6d65b69dd3f059e2277fc3f3a35b0a64f0f52f1357a5f7dadb772d2882c3aa27 | 4a06978536ab294b8b885556423596d82e02539fc9473159c76c1c70e0489cb4 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260607-003 |
| cl-20260607-004 | 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80 | 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80 | 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80 | 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80 | 2e5d5903523e111ddfa0f0716a83b1236ad6ca21c0bc3a1de7307e6f82a0cb80 | fa91fa4ce114ab03bca844049a7fd233d3add7546e5f389da6534a81b3fa2113 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260607-004 |
| cl-20260613-001 | bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb | bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb | bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb | bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb | bafdc9c2e266be8a6519f2b034ae9b8afdbbd28fc32fd9b41e05fb5e0de6aafb | e953fff84df53c921de21fded6d12c49d9bff229fd7969715abc65bdf2c8983b | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-001 |
| cl-20260613-002 | f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4 | f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4 | f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4 | f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4 | f06d4107adaa1d6b484bc69a0defa87f043c9e9abbe081c79e7e39420ee021d4 | af555bcc0c03605e181ef5f7d272c750c39c691e97b5c9eb1eaa2c658d3d51ae | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-002 |
| cl-20260613-003 | 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6 | 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6 | 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6 | 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6 | 67f2f7c9beabc3e7983d2e981ba4e35d716334305576e59a0f015b805cb8b9c6 | 236c71af5ea374aad74629c43752932567b72554890798aaf3eb8f4fda91da99 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes ReviewModal failure logging for the review workflow launched from Community Gallery story details. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-003 |
| cl-20260613-004 | 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22 | 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22 | 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22 | 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22 | 2362f7d68efc4776416b84b70763f5ad56ffc79d09a5aa1a85ee793952606d22 | 8540b912af7d097e7002d98b824cff71a1434581d514c6419224541a09849a89 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-004 |
| cl-20260613-005 | 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d | 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d | 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d | 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d | 372726d586dac24c6281c902637f5177da5b90ab426d42e69d15144c7b56810d | e7ad1cb3d014de851abe0a43c7c480af697159a765f7472e82ad6d719bb1d715 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-005 |
| cl-20260613-006 | e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501 | e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501 | e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501 | e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501 | e69a0c56518215e4ce72953a9bd00d757130536949c408718d6da90532cd0501 | 4422b4b36aff402ef41f9009706705c05e0aee34b4060ef302b5d7c61f3056cf | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-006 |
| cl-20260613-007 | 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4 | 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4 | 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4 | 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4 | 4c55f7cbef6a47df21171f5cfce91d55d94b8d42d9e7eb1a89488f4019f1acd4 | 7984fe655e8e6e7e888eac6b8f31f18c4aa53b28bbcedd9994bdc440d0996575 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-007 |
| cl-20260613-008 | 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e | 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e | 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e | 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e | 6e02ff94169cbb76671042fe9e76981e400fbcc5e5ccf8e5cfb0db2eef80110e | 0dbb354d6ca3a7192a351ef26d15a9125b2470dba838fb8f429c987d97d58d4a | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-008 |
| cl-20260613-009 | a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1 | a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1 | a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1 | a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1 | a19124c8ba07b7e53e3a311d6df992174b4b652cf723db8c2f84f9a8f446fdb1 | 1f2d3d764e65ff42d0360523dbbc9c1e1ee3e881ff16d58861f21838826ae247 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-009 |
| cl-20260613-010 | 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85 | 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85 | 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85 | 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85 | 5d964af7bf3d1b888babc4e2e4cf2cc845442bb3c05ff97424796a7af28e9c85 | 8f461de308fa877cfe47b819f5a146a2550d04b9e757274ff6ce223ea2bc760c | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-010 |
| cl-20260613-011 | f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a | f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a | f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a | f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a | f486402dbefd7de9e2a19107b39c3197d7c4631988645973612f11fd6b07b94a | e711906b804bd2f447a80164c08983e845c82e4f12254c58ce457f217fa4902f | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-011 |
| cl-20260613-012 | cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb | cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb | cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb | cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb | cb4a9745bdf2282ca31e7b10f4fd1e9b4e4d34960a4ffd5b15561654cff7d5eb | 5bb6dbfff24824d5cb16e4c1ebbca2ce0afae4e7b4994f1657709a698f26c41e | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-012 |
| cl-20260613-013 | 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540 | 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540 | 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540 | 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540 | 3bb211b632d0bde7086813c39adbac67b118a21b042ff29423ad5aa496ff0540 | 5fc68e12e7722bd77e296aea22265885384f638a1c7a64e7f6afc6b2486d0f07 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-013 |
| cl-20260613-014 | 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b | 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b | 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b | 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b | 6b6f82becb6ab4e8f5fbb2db089248395844a463e735b499f4173c98466efd6b | 912d6e76cb4f77a6403d03c50526f5e697a6cf5b00e7d330432378a56df8210d | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260613-014 |
| cl-20260614-001 | fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121 | fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121 | fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121 | fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121 | fb2f4aec4c9093ac67a6ac763d2d491371721c5a00abe4658e9ccf5b4bf4f121 | 02892a74c938ac372d27f4ed605a4df346e1aaf0b63ce2764cc9719bc06bbb1d | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260614-001 |
| cl-20260614-002 | 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9 | 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9 | 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9 | 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9 | 093b66b2c85d9732980134fad2346ef8d8355e30f39c2c22dc5915a40812a6a9 | ee721b5b6f64cbe7c70de2b233164956e6d4878379332637d3d8d8cf4c572a8a | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260614-002 |
| cl-20260614-003 | f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180 | f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180 | f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180 | f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180 | f6e2e3e7f511b6e38d5fb45294fc396c6c6627aad68b2ddab714e7f14e100180 | 26e40dd2aabf1711925142ee71060ef1eb5ca089f0ea9e6476403df4d18f15a4 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes ownership enforcement for published_scenarios, the durable publication rows consumed by Community Gallery. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260614-003 |
| cl-20260614-004 | 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a | 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a | 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a | 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a | 0edde518eafcce06bf4823a07095baad87b00abd4961393febe6dbda600e9c9a | 32b74deaa3d96a1897068257006d9b2e820f1374c156d65042b1c14ddf6e275f | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes Community Gallery like, save, and play counters and their backing ledger and trigger behavior. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260614-004 |
| cl-20260614-005 | fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90 | fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90 | fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90 | fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90 | fe011d3b76053a7e36ef18ac5e9a670c287b600e4ac14420f38c427ca7a91a90 | 0087d8e8baa2ab777d42b717ce09719d3a0dd1e31defc1d139f61c5d38352a32 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes the Gallery RPC and published-work privacy rules that determine which creator stories Community Gallery may expose. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260614-005 |
| cl-20260614-006 | eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026 | eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026 | eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026 | eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026 | eccb1d07647758548079074888f3f3b4e2900aaeab0ada411aa8e54e5ec69026 | 27c1d4b61aae4cb434caa64191f30ff3cf1ccbd0ba4877f0990bf671ee152d84 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260614-006 |
| cl-20260614-007 | 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be | 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be | 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be | 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be | 328423311140c8b1a5b28e83c8e92ba243e859224f387778e9f0a9ff22a925be | f954fe0bcaa138388bb813ac028dc7142d777b902e19d959ef40976ca1f6fe3e | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | not_applicable | The complete Phase 5 owner-record review found no positively verified Community Gallery effect in this record. It remains in global history, while other capability mapping is deliberately deferred. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260614-007 |
| cl-20260619-001 | 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289 | 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289 | 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289 | 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289 | 89dcb6a2258b56802508973a0e1c2e82954a45412004062f55addb77103dd289 | 735609feccb425d3b3e920eee0b598bedc2a0a476e8167b79cd033429c59c46f | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes Gallery likes, view and play guards, published-story visibility, and shared Gallery request paths. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260619-001 |
| cl-20260619-002 | 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35 | 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35 | 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35 | 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35 | 21da375f05724f8da0f3f6ba6fb764553524b23928ff2d56d3e76461d51ccd35 | a51a9ee0bc50fa8e7c8d14e6075b3dcbee20648a1f2eec619a8ad19b8e9e94bd | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes public scenario-review reads and the Story Detail review surface opened from Community Gallery. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260619-002 |
| cl-20260619-003 | 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92 | 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92 | 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92 | 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92 | 00a97bf22b7920b60b138dc4a78a6f1f3c5aa62e7cccc610040e40bfb02fee92 | c2b4adc1a15a8fc893250c4b7cfe8147a455fa386e4f29cf8606be8b19f53e4c | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes published-scenario access and the Gallery data service used by saved and published story surfaces. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260619-003 |
| cl-20260620-001 | fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c | fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c | fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c | fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c | fd9c8447f0ed35db7208b5de2aae891ee07a65057463a76c052fda939d7b926c | ef203c85b30cfdc63bba0f576296a52030fdd7839ca5e70d305d08f5fc2d0860 | exact | identical-across-all-captured-sources | Owner database, local storage, and repository seed contain the same exact canonical payload. | owner-db, local-storage, repository-seed | applicable | The record changes Gallery publish and unpublish cover handling through src/services/gallery-data.ts and the public cover used by Gallery cards. | User-approved source authority in CG-LOG-022; Codex Phase 5 reconciliation and applicability review on 2026-08-04 | imported | LEGACY-QH-cl-20260620-001 |

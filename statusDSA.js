const STATUS_DSA = {
    NEW: "new",
    PASS_SS: "passSS",
    REJECT_SS: "rejectSS",
    PASS_AIS: "passAIS",
    REJECT_AIS: "rejectAIS",
    TIMEOUT_AIS: "timeoutAIS",
    PASS_IMX: "passIMX",
    REJECT_IMX: "rejectIMX",
    TIMEOUT_IMX: "timeoutIMX",
    PASS_CONTRACT: "passContract",
    REJECT_CONTRACT: "rejectContract",
    TIMEOUT_CONTRACT: "timeoutContract",
    PASS_REFERENCES: "passReferences",
    REJECT_REFERENCES: "rejectReferences",
    TIMEOUT_REFERENCES: "timeoutReferences",
    PASS_DSA: "passDSA",
    REJECT_DSA: "rejectDSA",
    TIMEOUT_DSA: "timeoutDSA",
    PASS_CIC: "passCIC",
    REJECT_CIC: "rejectCIC",
    TIMEOUT_CIC: "timeoutCIC",
    PASS_EKYC: "passEkyc",
    REJECT_EKYC: "rejectEkyc",
    TIMEOUT_EKYC: "timeoutEkyc",
    PASS: "pass",
    TIMEOUT: "timeout",
    PASS_AF: "passAF",
    REJECT_AF: "rejectAF"
}

const listReject = [
    STATUS_DSA.REJECT_SS,
    STATUS_DSA.REJECT_AIS,
    STATUS_DSA.REJECT_IMX,
    STATUS_DSA.REJECT_CONTRACT,
    STATUS_DSA.REJECT_REFERENCES,
    STATUS_DSA.REJECT_DSA,
    STATUS_DSA.REJECT_CIC,
    STATUS_DSA.REJECT_EKYC,
    STATUS_DSA.REJECT_AF
]

const listPass = [
    STATUS_DSA.PASS_SS,
    STATUS_DSA.PASS_AIS,
    STATUS_DSA.PASS_IMX,
    STATUS_DSA.PASS_CONTRACT,
    STATUS_DSA.PASS_REFERENCES,
    STATUS_DSA.PASS_DSA,
    STATUS_DSA.PASS_CIC,
    STATUS_DSA.PASS_EKYC,
    STATUS_DSA.PASS_AF
]
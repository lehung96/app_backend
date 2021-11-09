CREATE TABLE customers (
    customerId SERIAL PRIMARY KEY,
    request_id VARCHAR(20) NOT NULL CONSTRAINT req_check CHECK (
        15 < CHAR_LENGTH(request_id)
        AND CHAR_LENGTH(request_id) < 21
    ),
    channel VARCHAR(50) NOT NULL,
    partner_code VARCHAR(50) NOT NULL,
    dsa_agent_code VARCHAR(50) NOT NULL,
    customer_name VARCHAR(80) NOT NULL CONSTRAINT cus_check CHECK (
        0 < CHAR_LENGTH(customer_name)
        AND CHAR_LENGTH(customer_name) < 81
    ),
    gender CHAR(1) NOT NULL CONSTRAINT gen_check CHECK (
        gender = 'F'
        OR gender = 'M'
    ),
    date_of_birth CHAR(10) NOT NULL,
    identity_card_id VARCHAR(12) NOT NULL CONSTRAINT card_check CHECK (
        8 < CHAR_LENGTH(identity_card_id)
        AND CHAR_LENGTH(identity_card_id) < 13
    ),
    issue_date CHAR(10) NOT NULL,
    issue_place CHAR(5) NOT NULL,
    phone_number VARCHAR(11) NOT NULL CONSTRAINT phone_check CHECK (
        9 < CHAR_LENGTH(phone_number)
        AND CHAR_LENGTH(phone_number) < 12
    ),
    job_type VARCHAR(50) NOT NULL,
    timestamp BIGINT,
    relation_1 VARCHAR(50) NOT NULL,
    relation_1_name VARCHAR(80) NOT NULL CONSTRAINT rela_name_1_check CHECK (
        0 < CHAR_LENGTH(relation_1_name)
        AND CHAR_LENGTH(relation_1_name) < 81
    ),
    relation_1_phone_number CHAR(10) NOT NULL CONSTRAINT rela_phone_1_check CHECK (CHAR_LENGTH(relation_1_phone_number) < 11),
    relation_2 VARCHAR(50) NOT NULL,
    relation_2_name VARCHAR(80) NOT NULL CONSTRAINT rela_name_2_check CHECK (
        0 < CHAR_LENGTH(relation_1_name)
        AND CHAR_LENGTH(relation_2_name) < 81
    ),
    relation_2_phone_number CHAR(10) NOT NULL CONSTRAINT rela_phone_2_check CHECK (CHAR_LENGTH(relation_2_phone_number) < 11),
    img_id_card VARCHAR(50) NOT NULL,
    img_selfie VARCHAR(50) NOT NULL
);
CREATE TABLE doc_collecting_list (
    documentId SERIAL PRIMARY KEY,
    "loanId" INTEGER NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_name VARCHAR(100)
);
CREATE TABLE address (
    addressId SERIAL PRIMARY KEY,
    "customerId" INTEGER NOT NULL,
    field_type VARCHAR(10) NOT NULL,
    name VARCHAR(50),
    province VARCHAR(3) NOT NULL,
    district VARCHAR(4) NOT NULL,
    ward VARCHAR(6) NOT NULL,
    address VARCHAR(100) NOT NULL CONSTRAINT address_check CHECK (
        0 < CHAR_LENGTH(address)
        AND CHAR_LENGTH(address) < 101
    )
);
CREATE TABLE loan (
    loanId SERIAL PRIMARY KEY,
    "customerId" INTEGER NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    loan_amount INTEGER NOT NULL CONSTRAINT loan_amount_check CHECK (
        0 <= loan_amount
        AND loan_amount <= 999999999999
    ),
    loan_tenor INTEGER NOT NULL CONSTRAINT loan_tenor_check CHECK (
        0 <= loan_tenor
        AND loan_tenor <= 999
    ),
    "address_permanent_id" INTEGER NOT NULL,
    married_status VARCHAR(10) NOT NULL,
    beneficiary_name VARCHAR(80) CONSTRAINT beneficiary_name_check CHECK (
        0 < CHAR_LENGTH(beneficiary_name)
        AND CHAR_LENGTH(beneficiary_name) < 81
    ),
    bank_code VARCHAR(20),
    bank_branch_code VARCHAR(20),
    -- bank_account VARCHAR(50) CONSTRAINT bank_account_check CHECK (
    --     0 < CHAR_LENGTH(bank_account)
    --     AND CHAR_LENGTH(bank_account) < 51
    -- ),
    bank_account VARCHAR(50),
    monthly_income INTEGER NOT NULL CONSTRAINT monthly_income_check CHECK (
        0 <= monthly_income
        AND monthly_income <= 999999999999
    ),
    other_income INTEGER CONSTRAINT other_income_check CHECK (
        0 <= other_income
        AND other_income <= 999999999999
    ),
    monthly_expense INTEGER NOT NULL,
    "address_workplace_id" INTEGER NOT NULL,
    loan_purpose VARCHAR(50) NOT NULL,
    "timestamp" BIGINT,
    "status" VARCHAR(50),
    proposal_id INTEGER,
    contract_number INTEGER,
    reject_reason VARCHAR(250),
    selected_offer_id INTEGER, 
    selected_offer_amount INTEGER,
    selected_offer_insurance_type INTEGER,
);

CREATE TABLE offer (
    offerId SERIAL PRIMARY KEY,
    statusId INTEGER,
    offer_id VARCHAR(50),
    offer_amount INTEGER,
    interest_rate INTEGER CONSTRAINT monthly_income_check CHECK (
        0 <= interest_rate
        AND interest_rate <= 100
    ),
    monthly_installment VARCHAR(50),
    tenor INTEGER ,
    min_financed_amount INTEGER,
    max_financed_amount INTEGER,
    offer_var INTEGER,
    offer_type VARCHAR(10)
);

CREATE TABLE insurance (
    insuranceId SERIAL PRIMARY KEY,
    offerId INTEGER,
    type VARCHAR(50),
    amount INTEGER,
    percent_insurance VARCHAR(50),
    base_calculation VARCHAR(50)
);


CREATE TABLE status (
    statusId SERIAL PRIMARY KEY,
    customerId INTEGER NOT NULL,
    "request_id" VARCHAR(50) NOT NULL,
    partner_code VARCHAR(10) NOT NULL,
    proposal_id VARCHAR(50),
    contract_number VARCHAR(50),
    reject_reason VARCHAR(50)
);
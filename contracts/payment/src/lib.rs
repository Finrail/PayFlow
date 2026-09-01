#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Map};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaymentState {
    Created,
    Funded,
    Released,
    Refunded,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Payment {
    pub id: u64,
    pub payer: Address,
    pub payee: Address,
    pub amount: i128,
    pub asset: Address,
    pub state: PaymentState,
    pub created_at: u64,
}

#[contracttype]
pub struct PaymentEscrow {
    pub owner: Address,
    pub payment_counter: u64,
    pub payments: Map<u64, Payment>,
}

#[contract]
pub struct PayFlowContract;

#[contractimpl]
impl PayFlowContract {
    /// Initialize the contract with an owner
    pub fn initialize(env: Env, owner: Address) {
        if env.storage().instance().has(&String::from_str(&env, "escrow")) {
            panic!("already initialized");
        }

        let escrow = PaymentEscrow {
            owner: owner.clone(),
            payment_counter: 0,
            payments: Map::new(&env),
        };

        env.storage().instance().set(&String::from_str(&env, "escrow"), &escrow);
    }

    /// Create a new payment escrow
    pub fn create_payment(
        env: Env,
        payer: Address,
        payee: Address,
        amount: i128,
        asset: Address,
    ) -> u64 {
        let mut escrow: PaymentEscrow = env
            .storage()
            .instance()
            .get(&String::from_str(&env, "escrow"))
            .expect("not initialized");

        // Verify authorization
        payer.require_auth();

        let payment_id = escrow.payment_counter;
        escrow.payment_counter += 1;

        let payment = Payment {
            id: payment_id,
            payer: payer.clone(),
            payee: payee.clone(),
            amount,
            asset: asset.clone(),
            state: PaymentState::Created,
            created_at: env.ledger().sequence() as u64,
        };

        escrow.payments.set(payment_id, payment);
        env.storage().instance().set(&String::from_str(&env, "escrow"), &escrow);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "payment"), String::from_str(&env, "created")),
            (payment_id, payer, payee, amount),
        );

        payment_id
    }

    /// Fund a payment (transfer assets to escrow)
    pub fn fund_payment(env: Env, payment_id: u64) {
        let mut escrow: PaymentEscrow = env
            .storage()
            .instance()
            .get(&String::from_str(&env, "escrow"))
            .expect("not initialized");

        let mut payment = escrow
            .payments
            .get(payment_id)
            .expect("payment not found");

        // Verify authorization from payer
        payment.payer.require_auth();

        // Check state
        if payment.state != PaymentState::Created {
            panic!("payment not in created state");
        }

        // Update state
        payment.state = PaymentState::Funded;
        escrow.payments.set(payment_id, payment);
        env.storage().instance().set(&String::from_str(&env, "escrow"), &escrow);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "payment"), String::from_str(&env, "funded")),
            payment_id,
        );
    }

    /// Release payment to payee
    pub fn release_payment(env: Env, payment_id: u64) {
        let mut escrow: PaymentEscrow = env
            .storage()
            .instance()
            .get(&String::from_str(&env, "escrow"))
            .expect("not initialized");

        let mut payment = escrow
            .payments
            .get(payment_id)
            .expect("payment not found");

        // Verify authorization from payer or owner
        payment.payer.require_auth();

        // Check state
        if payment.state != PaymentState::Funded {
            panic!("payment not in funded state");
        }

        // Update state
        payment.state = PaymentState::Released;
        let payee = payment.payee.clone();
        let amount = payment.amount;
        escrow.payments.set(payment_id, payment);
        env.storage().instance().set(&String::from_str(&env, "escrow"), &escrow);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "payment"), String::from_str(&env, "released")),
            (payment_id, payee, amount),
        );
    }

    /// Refund payment back to payer
    pub fn refund_payment(env: Env, payment_id: u64) {
        let mut escrow: PaymentEscrow = env
            .storage()
            .instance()
            .get(&String::from_str(&env, "escrow"))
            .expect("not initialized");

        let mut payment = escrow
            .payments
            .get(payment_id)
            .expect("payment not found");

        // Verify authorization from payee or owner
        payment.payee.require_auth();

        // Check state
        if payment.state != PaymentState::Funded {
            panic!("payment not in funded state");
        }

        // Update state
        payment.state = PaymentState::Refunded;
        let payer = payment.payer.clone();
        let amount = payment.amount;
        escrow.payments.set(payment_id, payment);
        env.storage().instance().set(&String::from_str(&env, "escrow"), &escrow);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "payment"), String::from_str(&env, "refunded")),
            (payment_id, payer, amount),
        );
    }

    /// Cancel a payment
    pub fn cancel_payment(env: Env, payment_id: u64) {
        let mut escrow: PaymentEscrow = env
            .storage()
            .instance()
            .get(&String::from_str(&env, "escrow"))
            .expect("not initialized");

        let mut payment = escrow
            .payments
            .get(payment_id)
            .expect("payment not found");

        // Verify authorization from payer
        payment.payer.require_auth();

        // Check state
        if payment.state != PaymentState::Created {
            panic!("payment not in created state");
        }

        // Update state
        payment.state = PaymentState::Cancelled;
        escrow.payments.set(payment_id, payment);
        env.storage().instance().set(&String::from_str(&env, "escrow"), &escrow);

        // Emit event
        env.events().publish(
            (String::from_str(&env, "payment"), String::from_str(&env, "cancelled")),
            payment_id,
        );
    }

    /// Get payment details
    pub fn get_payment(env: Env, payment_id: u64) -> Payment {
        let escrow: PaymentEscrow = env
            .storage()
            .instance()
            .get(&String::from_str(&env, "escrow"))
            .expect("not initialized");

        escrow.payments
            .get(payment_id)
            .expect("payment not found")
    }

    /// Get escrow info
    pub fn get_escrow(env: Env) -> PaymentEscrow {
        env.storage()
            .instance()
            .get(&String::from_str(&env, "escrow"))
            .expect("not initialized")
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{Address, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let owner = Address::generate(&env);

        PayFlowContract::initialize(env.clone(), owner.clone());

        let escrow = PayFlowContract::get_escrow(env);
        assert_eq!(escrow.owner, owner);
        assert_eq!(escrow.payment_counter, 0);
    }

    #[test]
    fn test_create_payment() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let payer = Address::generate(&env);
        let payee = Address::generate(&env);
        let asset = Address::generate(&env);

        PayFlowContract::initialize(env.clone(), owner);

        let payment_id = PayFlowContract::create_payment(
            env.clone(),
            payer.clone(),
            payee.clone(),
            1000,
            asset.clone(),
        );

        let payment = PayFlowContract::get_payment(env, payment_id);
        assert_eq!(payment.id, payment_id);
        assert_eq!(payment.payer, payer);
        assert_eq!(payment.payee, payee);
        assert_eq!(payment.amount, 1000);
        assert_eq!(payment.asset, asset);
        assert_eq!(payment.state, PaymentState::Created);
    }

    #[test]
    fn test_fund_payment() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let payer = Address::generate(&env);
        let payee = Address::generate(&env);
        let asset = Address::generate(&env);

        PayFlowContract::initialize(env.clone(), owner);

        let payment_id = PayFlowContract::create_payment(
            env.clone(),
            payer.clone(),
            payee.clone(),
            1000,
            asset.clone(),
        );

        PayFlowContract::fund_payment(env.clone(), payment_id);

        let payment = PayFlowContract::get_payment(env, payment_id);
        assert_eq!(payment.state, PaymentState::Funded);
    }

    #[test]
    fn test_release_payment() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let payer = Address::generate(&env);
        let payee = Address::generate(&env);
        let asset = Address::generate(&env);

        PayFlowContract::initialize(env.clone(), owner);

        let payment_id = PayFlowContract::create_payment(
            env.clone(),
            payer.clone(),
            payee.clone(),
            1000,
            asset.clone(),
        );

        PayFlowContract::fund_payment(env.clone(), payment_id);
        PayFlowContract::release_payment(env.clone(), payment_id);

        let payment = PayFlowContract::get_payment(env, payment_id);
        assert_eq!(payment.state, PaymentState::Released);
    }

    #[test]
    fn test_refund_payment() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let payer = Address::generate(&env);
        let payee = Address::generate(&env);
        let asset = Address::generate(&env);

        PayFlowContract::initialize(env.clone(), owner);

        let payment_id = PayFlowContract::create_payment(
            env.clone(),
            payer.clone(),
            payee.clone(),
            1000,
            asset.clone(),
        );

        PayFlowContract::fund_payment(env.clone(), payment_id);
        PayFlowContract::refund_payment(env.clone(), payment_id);

        let payment = PayFlowContract::get_payment(env, payment_id);
        assert_eq!(payment.state, PaymentState::Refunded);
    }

    #[test]
    #[should_panic(expected = "payment not in created state")]
    fn test_cannot_release_unfunded_payment() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let payer = Address::generate(&env);
        let payee = Address::generate(&env);
        let asset = Address::generate(&env);

        PayFlowContract::initialize(env.clone(), owner);

        let payment_id = PayFlowContract::create_payment(
            env.clone(),
            payer.clone(),
            payee.clone(),
            1000,
            asset.clone(),
        );

        PayFlowContract::release_payment(env, payment_id);
    }

    #[test]
    #[should_panic(expected = "payment not in funded state")]
    fn test_cannot_refund_released_payment() {
        let env = Env::default();
        let owner = Address::generate(&env);
        let payer = Address::generate(&env);
        let payee = Address::generate(&env);
        let asset = Address::generate(&env);

        PayFlowContract::initialize(env.clone(), owner);

        let payment_id = PayFlowContract::create_payment(
            env.clone(),
            payer.clone(),
            payee.clone(),
            1000,
            asset.clone(),
        );

        PayFlowContract::fund_payment(env.clone(), payment_id);
        PayFlowContract::release_payment(env.clone(), payment_id);
        PayFlowContract::refund_payment(env, payment_id);
    }
}

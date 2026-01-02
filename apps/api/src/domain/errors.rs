use thiserror::Error;

#[derive(Error, Debug)]
pub enum DomainError {
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Business rule violation: {0}")]
    BusinessRuleViolation(String),
}


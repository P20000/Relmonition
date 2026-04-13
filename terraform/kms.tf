resource "aws_kms_key" "eks_secrets" {
  description             = "KMS key for EKS Secret encryption (HIPAA)"
  deletion_window_in_days = 7
  enable_key_rotation     = true
}

resource "aws_kms_alias" "eks_secrets" {
  name          = "alias/relmonition-eks-secrets"
  target_key_id = aws_kms_key.eks_secrets.key_id
}

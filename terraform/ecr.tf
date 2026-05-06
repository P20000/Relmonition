resource "aws_ecr_repository" "server" {
  name                 = "relmonition-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.eks_secrets.arn
  }

  force_delete         = true

  tags = {
    Project = "Relmonition"
  }
}

resource "aws_ecr_lifecycle_policy" "server_policy" {
  repository = aws_ecr_repository.server.name

  policy = <<EOF
{
    "rules": [
        {
            "rulePriority": 1,
            "description": "Keep last 10 images",
            "selection": {
                "tagStatus": "any",
                "countType": "imageCountMoreThan",
                "countNumber": 10
            },
            "action": {
                "type": "expire"
            }
        }
    ]
}
EOF
}

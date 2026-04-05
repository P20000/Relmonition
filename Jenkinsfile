pipeline {
    agent any
    environment {
        AWS_REGION = 'ap-south-1'
        DOCKER_IMAGE = 'relmonition-server:latest'
    }
    stages {
        stage('Build Docker') {
            steps {
                script {
                    dir('server') {
                        sh "docker build -t ${env.DOCKER_IMAGE} ."
                    }
                }
            }
        }
        stage('Terraform Apply') {
            steps {
                dir('terraform') {
                    sh 'terraform init'
                    sh 'terraform apply -auto-approve'
                }
            }
        }
    }
}

#!/bin/bash
set -e

# Configuration
REGION="ap-south-1"
VPC_NAME="relmonition-vpc"

echo "====================================================="
echo " Starting Safe Infrastructure Clean and Destroy      "
echo "====================================================="

# 1. Attempt Kubernetes-level clean up first if the cluster is still reachable
echo "Checking Kubernetes cluster status..."
if kubectl get nodes &>/dev/null; then
  echo "Cluster is online. Deleting Kubernetes LoadBalancer services and Ingresses..."
  kubectl delete service --all-namespaces --field-selector spec.type=LoadBalancer --timeout=60s || true
  kubectl delete ingress --all-namespaces --timeout=60s || true
  echo "Waiting 30 seconds for cloud provider resources to detach..."
  sleep 30
else
  echo "Kubernetes cluster is offline or unreachable. Proceeding with direct AWS cleanup."
fi

# 2. Get the VPC ID
echo "Looking up VPC: $VPC_NAME in region $REGION..."
VPC_ID=$(aws ec2 describe-vpcs --region "$REGION" --filters "Name=tag:Name,Values=$VPC_NAME" --query "Vpcs[0].VpcId" --output text 2>/dev/null || true)

if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ]; then
  echo "VPC $VPC_NAME not found or already deleted."
else
  echo "Found VPC ID: $VPC_ID"

  # Find all subnet IDs in this VPC
  echo "Querying subnets inside VPC $VPC_ID..."
  SUBNET_IDS=$(aws ec2 describe-subnets --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text)

  if [ -n "$SUBNET_IDS" ]; then
    echo "Subnets in VPC: $SUBNET_IDS"
    
    # --- Clean Classic Load Balancers ---
    echo "Checking for Classic Load Balancers attached to subnets..."
    CLASSIC_ELBS=$(aws elb describe-load-balancers --region "$REGION" --query "LoadBalancerDescriptions[*].{Name:LoadBalancerName,Subnets:Subnets}" --output json)
    
    for row in $(echo "${CLASSIC_ELBS}" | jq -r '.[] | @base64' 2>/dev/null || true); do
      _jq() {
        echo ${row} | base64 --decode | jq -r ${1}
      }
      ELB_NAME=$(_jq '.Name')
      ELB_SUBNETS=$(_jq '.Subnets[]')
      
      # Check if this ELB is in our target subnets
      IN_VPC=false
      for s in $ELB_SUBNETS; do
        if [[ " $SUBNET_IDS " =~ " $s " ]]; then
          IN_VPC=true
          break
        fi
      done
      
      if [ "$IN_VPC" = true ]; then
        echo "Deleting Classic Load Balancer: $ELB_NAME"
        aws elb delete-load-balancer --region "$REGION" --load-balancer-name "$ELB_NAME" || true
      fi
    done

    # --- Clean Application/Network Load Balancers ---
    echo "Checking for Application/Network Load Balancers attached to subnets..."
    ALB_NLBS=$(aws elbv2 describe-load-balancers --region "$REGION" --query "LoadBalancers[*].{Arn:LoadBalancerArn,Subnets:AvailabilityZones[*].SubnetId}" --output json)
    
    for row in $(echo "${ALB_NLBS}" | jq -r '.[] | @base64' 2>/dev/null || true); do
      _jq() {
        echo ${row} | base64 --decode | jq -r ${1}
      }
      LB_ARN=$(_jq '.Arn')
      LB_SUBNETS=$(_jq '.Subnets[]')
      
      IN_VPC=false
      for s in $LB_SUBNETS; do
        if [[ " $SUBNET_IDS " =~ " $s " ]]; then
          IN_VPC=true
          break
        fi
      done
      
      if [ "$IN_VPC" = true ]; then
        echo "Deleting V2 Load Balancer: $LB_ARN"
        aws elbv2 delete-load-balancer --region "$REGION" --load-balancer-arn "$LB_ARN" || true
      fi
    done
  fi

  # --- Wait for ENIs to detach ---
  echo "Waiting for Elastic Network Interfaces (ENIs) to detach and clear..."
  RETRIES=0
  while [ $RETRIES -lt 15 ]; do
    ENI_COUNT=$(aws ec2 describe-network-interfaces --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" --query "length(NetworkInterfaces)" --output text || echo "0")
    if [ "$ENI_COUNT" = "0" ] || [ -z "$ENI_COUNT" ]; then
      echo "All network interfaces cleared."
      break
    fi
    echo "Still waiting... ($ENI_COUNT ENIs remaining in VPC)"
    sleep 10
    RETRIES=$((RETRIES+1))
  done

  # --- Clean Custom Security Groups ---
  echo "Checking for custom security groups in VPC..."
  SG_IDS=$(aws ec2 describe-security-groups --region "$REGION" --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=k8s-*" --query "SecurityGroups[*].GroupId" --output text || true)
  
  for sg in $SG_IDS; do
    if [ -n "$sg" ]; then
      echo "Deleting Kubernetes security group: $sg"
      aws ec2 delete-security-group --region "$REGION" --group-id "$sg" || true
    fi
  done
fi

# 3. Perform final Terraform destroy
echo "====================================================="
echo " Running final Terraform Destroy                     "
echo "====================================================="
terraform destroy -auto-approve

echo "====================================================="
echo " Infrastructure successfully destroyed!              "
echo "====================================================="

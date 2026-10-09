#!/usr/bin/env bash
# First deployment from an authenticated AWS CloudShell. Uses no local software.
set -euo pipefail
if [[ $# != 2 || ! "$1" =~ ^[0-9]{12}$ || ! "$2" =~ ^[a-z]{2}-[a-z]+-[0-9]+$ ]]; then
  echo 'Usage: bash infra/aws/deploy.sh YOUR_12_DIGIT_ACCOUNT_ID AWS_REGION' >&2
  exit 2
fi
PRB_EXPECTED_ACCOUNT="$1"
PRB_REGION="$2"
PRB_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PRB_ROOT"
export AWS_PAGER=""
PRB_STACK=opponent-pass-rush-demo
PRB_RELEASE="demo-$(date -u +%Y%m%dT%H%M%SZ)"
PRB_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
if [[ "$PRB_ACCOUNT" != "$PRB_EXPECTED_ACCOUNT" ]]; then
  echo 'The signed-in AWS account does not match the requested account. Nothing was created.' >&2
  exit 1
fi
if PRB_EXISTING=$(aws --region "$PRB_REGION" cloudformation describe-stacks --stack-name "$PRB_STACK" 2>&1); then
  echo 'This stack already exists. Follow the update/recovery procedure in docs/AWS_DEPLOYMENT.md; this script will not replace it.' >&2
  exit 1
else
  case "$PRB_EXISTING" in
    *'does not exist'*) ;;
    *) echo "$PRB_EXISTING" >&2; exit 1 ;;
  esac
fi
echo "Deploying in account $PRB_ACCOUNT, region $PRB_REGION."
echo 'This creates billable S3/CloudFront resources and a public website containing the processed NFL sample.'
npm test
aws --region "$PRB_REGION" cloudformation validate-template --template-body file://infra/aws/template.json >/dev/null
aws --region "$PRB_REGION" cloudformation deploy \
  --stack-name "$PRB_STACK" --template-file infra/aws/template.json \
  --parameter-overrides ReleaseId="$PRB_RELEASE" EnablePublicDemo=false \
  --tags Project=OpponentPassRushBrief Stage=Hackathon
PRB_OUTPUTS=$(aws --region "$PRB_REGION" cloudformation describe-stacks --stack-name "$PRB_STACK" --query 'Stacks[0].Outputs' --output json)
prb_output() {
  python3 -c 'import json,sys; print(next(x["OutputValue"] for x in json.load(sys.stdin) if x["OutputKey"] == sys.argv[1]))' "$1" <<< "$PRB_OUTPUTS"
}
PRB_BUCKET=$(prb_output AppBucketName)
PRB_DISTRIBUTION=$(prb_output DistributionId)
PRB_URL=$(prb_output WebsiteURL)
aws --region "$PRB_REGION" s3 sync dist/ "s3://$PRB_BUCKET/releases/$PRB_RELEASE/" \
  --cache-control 'public,max-age=0,s-maxage=3600,must-revalidate' --only-show-errors
# Enable only after a successful upload. Source code and raw data are never uploaded.
aws --region "$PRB_REGION" cloudformation deploy \
  --stack-name "$PRB_STACK" --template-file infra/aws/template.json \
  --parameter-overrides ReleaseId="$PRB_RELEASE" EnablePublicDemo=true
aws --region "$PRB_REGION" cloudfront wait distribution-deployed --id "$PRB_DISTRIBUTION"
python3 - "$PRB_URL" <<'PY'
import json,sys,urllib.request,urllib.error
base=sys.argv[1]
for route, mime in [('/', 'text/html'),('/app.js','javascript'),('/data/brief.json','application/json'),('/data/tracking/2021092601.json','application/json')]:
    with urllib.request.urlopen(base+route,timeout=60) as r:
        assert r.status==200 and mime in r.headers.get('Content-Type',''), route
        if route=='/data/brief.json':
            assert len(json.load(r)['plays'])==7767
try:
    urllib.request.urlopen(base+'/data/tracking/not-a-play.json',timeout=30)
    raise RuntimeError('A missing replay unexpectedly returned success')
except urllib.error.HTTPError as e:
    assert e.code in (403,404), e.code
print('Hosted HTML, JavaScript, data and missing-file checks passed.')
PY
echo "Website: $PRB_URL"
echo "Demo play: $PRB_URL/?opponent=CLE&down=all&distance=all&play=2021092601_3491"
echo "Release: $PRB_RELEASE"
echo 'Next: verify playback in Mac and Windows browsers before sharing with judges.'

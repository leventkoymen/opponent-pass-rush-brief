# AWS deployment runbook

## Live site: AWS Amplify Hosting

**Deployed:** [Film Room](https://production.dq0yh80z3cam4.amplifyapp.com/), Europe (London), `eu-west-2`. App ID: `dq0yh80z3cam4`; branch: `production`. Deployment 2 succeeded on 9 October 2026. The live replay and example tendency counts were checked in Chrome.

To update the live website:

1. Run `npm test` from the repository root.
2. ZIP the **contents** of `dist/`, with `index.html` at the ZIP root. Do not upload the submission archive or a ZIP containing a parent `dist` folder.
3. In the AWS console, choose London, open Amplify, select `opponent-pass-rush-brief`, then **Deploy updates** for `production`.
4. Choose **Drag and drop**, select the website ZIP, then **Save and deploy**.
5. Wait for **Deployed**, open the public URL, and check playback, opponent selection and evidence counts. The unfiltered Cleveland example has Garrett at 40/179 pressure-credit reps, extra rushers at 51/227 plays and Cover-3 at 80/227 labeled plays.

The GitHub repository contains the source and documentation; the current Amplify branch uses manual uploads and is not configured for automatic GitHub deployments. Hosting exposes the processed JSON as well as the interface. Usage follows the AWS account's plan and credits.

## Alternative S3/CloudFront deployment — not used for the live site

The remaining instructions apply only to the optional CloudFormation stack. No instance of that stack has been deployed or tested in an AWS account. These are not the settings or deployment history of the live Amplify site.

This guide uses AWS CLI v2 and standard commercial AWS regions. Use the event account and its permitted region. The template provisions two S3 buckets, two bucket policies, one CloudFront distribution, Origin Access Control, a cache policy and a response-headers policy. It provisions no compute service, IAM users, databases or viewer login system.

## Browser-only deployment with CloudShell

No Node.js or AWS software needs to be installed on your Mac or Windows computer. AWS CloudShell provides the development tools and uses your console sign-in. [AWS CloudShell documentation](https://docs.aws.amazon.com/cloudshell/latest/userguide/welcome.html).

1. Sign into the intended AWS account, select the event's permitted Region, and open CloudShell.
2. Use **Actions → Upload file** to upload `film-room-aws.zip`.
3. Run `unzip film-room-aws.zip`, then `cd opponent-pass-rush`.
4. Run `bash infra/aws/deploy.sh YOUR_12_DIGIT_ACCOUNT_ID AWS_REGION`, replacing both placeholders with the actual account and Region.

The script verifies the account, runs the tests, creates a disabled distribution, uploads the bundled app, enables public viewing, and checks the hosted files. It prints the actual website URL. It creates billable AWS resources. The account needs permission to manage the services listed above. The script is for a first deployment and refuses to modify an existing stack; use the detailed procedure below for recovery or updates.

The script has been syntax-checked locally, but has **not** been executed against AWS. Account permissions, quotas and the hosted application remain unverified until deployment. Keep the existing prototype as a reference until the AWS smoke tests and browser checks pass.

## 1. Local prerequisites

Run from the repository root. Required locally: Node 18+ and Python 3. For AWS: AWS CLI v2 with an event-account profile that can manage the listed resources and upload releases. Prefer the event's existing SSO/role setup; never put AWS credentials in source files or the frontend.

```sh
npm test
python3 -m json.tool infra/aws/template.json > /dev/null
# Optional isolated template-validation environment:
python3 -m venv /tmp/prb-cfn-validation
/tmp/prb-cfn-validation/bin/python -m pip install -r infra/aws/requirements-dev.txt
/tmp/prb-cfn-validation/bin/cfn-lint infra/aws/template.json
```

No dependency install is required for the app itself. `npm test` includes both data/replay tests and AWS template invariants. `cfn-lint` checks CloudFormation schemas; neither check proves account permissions, quotas, deployed access policy or runtime behavior.

## 2. Set the deployment context

Replace the profile with the event's configured profile and choose its allowed region. The region below is an example, not an event requirement. Shell examples use bash/zsh syntax.

```sh
PRB_PROFILE=event
PRB_REGION=us-east-1
PRB_STACK=opponent-pass-rush-demo
PRB_RELEASE=v1

aws --profile "$PRB_PROFILE" --region "$PRB_REGION" sts get-caller-identity
```

Verify the returned account is the event account. That command does not create resources. Do not use the existing Sites sign-in as an AWS credential.

## 3. Review and create a disabled stack

This is a first-deployment procedure. CloudFormation's planning call contacts AWS and creates a change set; it does not execute the listed resource changes.

```sh
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation deploy \
  --stack-name "$PRB_STACK" \
  --template-file infra/aws/template.json \
  --parameter-overrides ReleaseId="$PRB_RELEASE" EnablePublicDemo=false \
  --tags Project=OpponentPassRushBrief Stage=Hackathon \
  --no-execute-changeset
```

Copy the exact change-set ARN/name from the command's output. Inspect it, then execute that same reviewed change set when ready. The placeholder below must be replaced.

```sh
PRB_CHANGE_SET='REPLACE_WITH_RETURNED_CHANGE_SET_ARN'
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation describe-change-set \
  --stack-name "$PRB_STACK" --change-set-name "$PRB_CHANGE_SET"

aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation execute-change-set \
  --stack-name "$PRB_STACK" --change-set-name "$PRB_CHANGE_SET"
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation wait stack-create-complete \
  --stack-name "$PRB_STACK"
```

For an update, use `stack-update-complete` instead. If planning reports no changes, no execution is necessary. If creation fails, inspect stack events rather than repeatedly creating replacement stacks.

Retrieve the resource names from the actual stack, never from guessed bucket names:

```sh
PRB_APP_BUCKET=$(aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation describe-stacks \
  --stack-name "$PRB_STACK" --query 'Stacks[0].Outputs[?OutputKey==`AppBucketName`].OutputValue | [0]' --output text)
PRB_DATA_BUCKET=$(aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation describe-stacks \
  --stack-name "$PRB_STACK" --query 'Stacks[0].Outputs[?OutputKey==`DataBucketName`].OutputValue | [0]' --output text)
PRB_DISTRIBUTION=$(aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation describe-stacks \
  --stack-name "$PRB_STACK" --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue | [0]' --output text)
PRB_URL=$(aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation describe-stacks \
  --stack-name "$PRB_STACK" --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue | [0]' --output text)
```

## 4. Upload a validated release

The project download already contains all processed data. Upload only `dist/` to the web origin. Keep raw CSVs, source code, credentials, templates and local work files out of that prefix.

```sh
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" s3 sync \
  dist/ "s3://$PRB_APP_BUCKET/releases/$PRB_RELEASE/" \
  --cache-control 'public,max-age=0,s-maxage=3600,must-revalidate' \
  --only-show-errors
```

Use a new `PRB_RELEASE` for each changed build. No `--delete` is used. Browser caches must revalidate; CloudFront may cache for an hour. The template also enables compression. AWS CLI infers MIME types from extensions; the smoke test below verifies them.

If a source snapshot is useful, separately upload the pinned CSV directory and its provenance to the data bucket. This is optional and is not needed to serve the already-built demo.

```sh
PRB_RAW=/absolute/path/to/raw-data
PRB_SOURCE_REV=85da22eeff2f1d5be106faa9dfe06a1205f2defd
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" s3 sync \
  "$PRB_RAW/" "s3://$PRB_DATA_BUCKET/raw/$PRB_SOURCE_REV/" --only-show-errors
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" s3 cp \
  dist/data/audit.json "s3://$PRB_DATA_BUCKET/manifests/$PRB_SOURCE_REV/audit.json"
```

## 5. Choose judge access, then enable

The default distribution is disabled. **OAC protects the S3 origin; it is not viewer authentication.** Enabling this template exposes the HTML and processed JSON through CloudFront to anyone who can reach the URL. It does not preserve the current Sites owner-only audience.

For a public judging demo, confirm that this audience and the event's dataset-use terms are appropriate, then plan the access change:

```sh
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudformation deploy \
  --stack-name "$PRB_STACK" --template-file infra/aws/template.json \
  --parameter-overrides ReleaseId="$PRB_RELEASE" EnablePublicDemo=true \
  --no-execute-changeset
```

Inspect and execute the returned change set using step 3, then wait for `stack-update-complete`. If access must remain restricted, do not enable this public configuration; implement viewer access covering every protected file first. That implementation is not included here.

## 6. AWS smoke test and evidence

After the CloudFront distribution reports deployed:

```sh
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudfront wait distribution-deployed \
  --id "$PRB_DISTRIBUTION"

curl -fI "$PRB_URL/"
curl -fI "$PRB_URL/data/brief.json"
curl -fI "$PRB_URL/data/tracking/2021092601.json"
curl -I "$PRB_URL/data/tracking/does-not-exist.json"

aws --region "$PRB_REGION" --no-sign-request s3api head-object \
  --bucket "$PRB_APP_BUCKET" --key "releases/$PRB_RELEASE/index.html"
```

Expected results:

- Root: 200 with HTML content type.
- Brief/tracking: 200 with JSON content type, not HTML fallback.
- Missing JSON: an error status (typically 403 with a private S3 origin), not 200/index.html.
- Unsigned direct S3 request: access denied. This command is intentionally expected to fail; a successful result is a release-blocking finding.
- Response headers enforce HTTPS behavior and `nosniff`; verify gzip/Brotli separately with an `Accept-Encoding` request after the object has been cached.

Open the exact URL with `?opponent=CLE&down=all&distance=all&play=2021092601_3491`. Confirm 93/227 pressure plays and Garrett 40/179 pressure reps. Check the linked evidence counts, real replay, event jumps, export and a mobile viewport. Capture the AWS URL, stack outputs, screenshots and validation output for the submission. Do not mark AWS verification complete based solely on local tests or a template lint result.

Check CloudFront `Requests`, `BytesDownloaded`, `4xxErrorRate` and `5xxErrorRate` in CloudWatch's `us-east-1` region. This template does not configure detailed access logs, alarms or a dashboard. [CloudFront monitoring documentation](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/programming-cloudwatch-metrics.html).

## 7. Update or roll back

Upload the next build under a new release ID first. Plan and execute a stack update pointing `ReleaseId` at that prefix, with `EnablePublicDemo` explicitly set to the intended current access state. Then invalidate cached paths and repeat the smoke test:

```sh
aws --profile "$PRB_PROFILE" --region "$PRB_REGION" cloudfront create-invalidation \
  --distribution-id "$PRB_DISTRIBUTION" --paths '/*'
```

The command returns an invalidation ID. Wait for that invalidation before claiming the new release is fully available. To roll back, select the previous release ID in CloudFormation, invalidate, and smoke-test again. Old release prefixes are retained. Keeping a release prefix does not make it immutable at the permission level; the deployment operator must use new IDs rather than overwriting published files.

## 8. End-of-event cleanup

First disable the distribution through a reviewed stack update (`EnablePublicDemo=false`) and wait for deployment. Record the bucket names before deleting the stack. Stack deletion removes the distribution and related policies, but both S3 buckets are deliberately retained.

Retained buckets continue to incur storage charges. Remove data only after agreeing what to preserve. S3 versioning means deleting current objects does not remove older versions or delete markers; permanent cleanup must cover all versions before the buckets can be deleted. The 30-day lifecycle rule removes noncurrent versions, not entire old release prefixes. No automatic data-destruction script is included.

## Official references

- [CloudFront with S3 origin access control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFormation CloudFront distribution reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-cloudfront-distribution.html)
- [AWS CLI v2: deploy / no-execute-changeset](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/cloudformation/deploy.html)
- [CloudFront cache policy behavior](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cache-key-understand-cache-policy.html)

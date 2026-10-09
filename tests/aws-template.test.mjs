import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const t=JSON.parse(fs.readFileSync(new URL('../infra/aws/template.json',import.meta.url)));
test('AWS publication is explicit; a private S3 origin is never described as viewer authentication',()=>{
 assert.equal(t.Parameters.EnablePublicDemo.Default,'false');
 assert.deepEqual(t.Resources.Distribution.Properties.DistributionConfig.Enabled,{'Fn::If':['PublicDemoEnabled',true,false]});
 assert.match(t.Parameters.EnablePublicDemo.Description,/does not authenticate viewers/);
});
test('AWS source data stay outside the CloudFront origin, and both buckets block public access',()=>{
 for(const name of ['AppBucket','DataBucket']){
  const b=t.Resources[name];assert.equal(b.DeletionPolicy,'Retain');
  assert.ok(Object.values(b.Properties.PublicAccessBlockConfiguration).every(v=>v===true));
  assert.equal(b.Properties.VersioningConfiguration.Status,'Enabled');
 }
 const origin=t.Resources.Distribution.Properties.DistributionConfig.Origins[0];
 assert.deepEqual(origin.DomainName,{'Fn::GetAtt':['AppBucket','RegionalDomainName']});
 assert.ok(!t.Resources.DataBucketPolicy.Properties.PolicyDocument.Statement.some(s=>s.Effect==='Allow'));
 const allow=t.Resources.AppBucketPolicy.Properties.PolicyDocument.Statement.find(s=>s.Effect==='Allow');
 assert.equal(allow.Action,'s3:GetObject');assert.match(allow.Condition.StringEquals['AWS:SourceArn']['Fn::Sub'],/distribution\/\$\{Distribution\}/);
});
test('AWS assets use versioned releases, HTTPS, compression and no HTML fallback for missing JSON',()=>{
 const d=t.Resources.Distribution.Properties.DistributionConfig;
 assert.deepEqual(d.Origins[0].OriginPath,{'Fn::Sub':'/releases/${ReleaseId}'});
 assert.equal(d.DefaultCacheBehavior.ViewerProtocolPolicy,'redirect-to-https');assert.equal(d.DefaultCacheBehavior.Compress,true);
 assert.equal(d.CustomErrorResponses,undefined);
 assert.equal(t.Resources.CachePolicy.Properties.CachePolicyConfig.MinTTL,0);
});

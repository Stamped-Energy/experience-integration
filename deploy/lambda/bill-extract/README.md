# Bill extract Lambda — local invoke notes

```bash
cd deploy/lambda/bill-extract
python -m pytest -q
python -c "import handler, json; print(json.dumps(handler.handler({'Records':[{'s3':{'bucket':{'name':'b'},'object':{'key':'k'}}}]}, None), indent=2))"
```

Wire S3 → Lambda notification and `BILL_LINES_POST_URL` in a follow-up Terraform
module once the stub is replaced with real DHBVN parsing.

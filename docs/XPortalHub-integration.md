# XPortal Hub integration

Here are the informations that I think I have understand by reverse engineering the dapp sdk. (If a core team member read this, please correct me if I'm wrong)

# Workflows

## Login

XPortal Hub uses [native token authentication](https://github.com/multiversx/mx-sdk-js-native-auth-client). Which is a JWT like token signed with the user private key. You can generate or decode one on [utils.multiversx.com](https://utils.multiversx.com/auth?network=devnet)

The token is generated and added to the current url as a query parameter `accessToken`.

The integration must check if the `accessToken` is present in the url and if it is, it must verify the token signature and token payload (like timestamp to manage expiration).

### Token creation and signature

As stated in [native token client](https://github.com/multiversx/mx-sdk-js-native-auth-client) we should sign the concat of token body (init) and the wallet bech32 address : 

```js
const client = new NativeAuthClient();
const init = await client.initialize();

// obtain signature by signing the following message: `${address}${init}`
// Example:
// - if the address is `erd1qnk2vmuqywfqtdnkmauvpm8ls0xh00k8xeupuaf6cm6cd4rx89qqz0ppgl`
// - and the init string is `YXBpLmVscm9uZC5jb20.066de4ba7df143f2383c3e0cd7ef8eeaf13375d1123ec8bafcef9f7908344b0f.86400.e30`
// - then the signable message should be `erd1qnk2vmuqywfqtdnkmauvpm8ls0xh00k8xeupuaf6cm6cd4rx89qqz0ppgl066de4ba7df143f2383c3e0cd7ef8eeaf13375d1123ec8bafcef9f7908344b0f.86400.e30`
```

This is a bit more complex, we have in fact to use `SignableMessage` which can create a KeccaK256 hash.

```js
const init = await client.initialize();
const message = `${bech32Address}${init}`;
const address = new Address(bech32Address);
const signableMessage = new SignableMessage({
    address,
    message: Buffer.from(message, 'utf8'),
});

const cryptoMessage = Buffer.from(signableMessage.serializeForSigning().toString('hex'), "hex");
return signer.sign(cryptoMessage);
```

The `serializeForSigning` method concat in a Buffer a fixed prefix (`\x17Elrond Signed Message:
` by default) the message size and finally the message.
All is then hashed with KeccaK256.

# Sign Transactions

XPortal Hub use [message API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) to communicate with the dapp.

![Transactions workflow](./workflows_sign_transactions.png)

Message are formatted in JSON :
```json
Request transactions signature
{
  "type": "SIGN_TRANSACTIONS_REQUEST",
  "message": [list of transactions to sign]
}

Response with signed transactions
{
  "type": "SIGN_TRANSACTIONS_RESPONSE",
  "message": {
    "transactions": [list of signed transactions],
    "errors": If an error occured. In this case 'transactions' is not present
  }
}
```
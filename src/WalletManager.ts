import {UserSigner} from "@multiversx/sdk-wallet";
import type {UserAddress} from "@multiversx/sdk-wallet/out/userAddress";
import {NativeAuthClient} from "@multiversx/sdk-native-auth-client";
import {computed, reactive, ref, watch} from "vue";
import {Transaction} from "@multiversx/sdk-core";
import {Signature} from "@multiversx/sdk-wallet/out/signature";
import type {IPlainTransactionObject} from "@multiversx/sdk-core";
import {Address, SignableMessage} from "@multiversx/sdk-core";

export type SignResult =  {
    transactions?: IPlainTransactionObject[],
    error?: string
}
export const useWallet = () => {
    const address = ref<UserAddress | undefined>(undefined);
    const transactions = reactive<Transaction[]>([]);
    const ttl = ref<number>();
    const origin = ref<string>();
    let signer: UserSigner | undefined;

    const updateWallet = async (wallet: string)=> {
        if(!wallet) {
            return;
        }
        signer = UserSigner.fromPem(wallet);
        address.value = signer.getAddress();
    }
    watch(ttl, async (newTtl, oldValue) => {
        if(!newTtl || newTtl === oldValue) {
            return;
        }
        console.log("new ttl", newTtl);
        await chrome.storage.local.set({ttl: newTtl})
    });
    watch(origin, async (newOrigin, oldValue) => {
        if(!newOrigin || newOrigin === oldValue) {
            return;
        }
        console.log("new origin", newOrigin)
        await chrome.storage.local.set({origin: newOrigin})
    });

    const load = async () => {
        const result = await chrome.storage.local.get(["wallet", "transactions", "ttl", "origin"]);
        if(result.transactions) {
            transactions.splice(0);
            result.transactions
                .map((transaction: any) => Transaction.fromPlainObject(transaction))
                .forEach((transaction: Transaction) => transactions.push(transaction));
        }
        await loadTokenConfig();
        await updateWallet(result.wallet);
    }

    const loadTokenConfig = async () => {
        const result = await chrome.storage.local.get(["ttl", "origin"]);
        if(result.ttl) {
            console.log("setting ttl", result.ttl);
            ttl.value = result.ttl;
        } else {
            console.log("setting default ttl", 86400);
            ttl.value = 86400;
        }
        if(result.origin) {
            console.log("setting origin", result.origin);
            origin.value = result.origin;
        } else {
            console.log("setting default origin", "https://api.multiversx.com");
            origin.value = "https://api.multiversx.com";
        }
    }
    const saveWallet = async (wallet: string) => {
        await updateWallet(wallet);
        await chrome.storage.local.set({wallet});
    }

    const sign = async (bech32Address: string, message: string) => {
        if (!signer) {
            throw new Error("Wallet not loaded");
        }
        const address = new Address(bech32Address);
        const signableMessage = new SignableMessage({
            address,
            message: Buffer.from(message, 'utf8'),
        });

        const cryptoMessage = Buffer.from(signableMessage.serializeForSigning().toString('hex'), "hex");
        return signer.sign(cryptoMessage);
    }

    const signTransactions = async (transactions: Transaction[]): Promise<SignResult | undefined> => {
        const storedWallet = await chrome.storage.local.get(["wallet"]);
        if(!storedWallet.wallet) {
            return;
        }
        const signer = UserSigner.fromPem(storedWallet.wallet);

        try {
            const signedTransactions = [];
            let error;
            for (const transaction of transactions) {
                if (transaction.getChainID() === "0") {
                    error = "For security reason we don't sign mainnet transactions.";
                    break;
                }
                const serializedTransaction = transaction.serializeForSigning();
                const transactionSignature = await signer.sign(serializedTransaction);
                transaction.applySignature(new Signature(transactionSignature));
                signedTransactions.push(transaction.toPlainObject());
            }
            if (error) {
                return {error};
            } else {
                return {transactions: signedTransactions};
            }
        } catch (err) {
            console.log("error signing transactions", err);
            return {error: "error signing transactions"};
        }
    }

    const generateNativeToken = async () => {
        if (!signer || !address.value) {
            throw new Error("Wallet not loaded");
        }
        const tokenConfig = await chrome.storage.local.get(["ttl", "origin"]);
        const ttl = tokenConfig.ttl || 86400;
        const origin = tokenConfig.origin || "https://api.multiversx.com";
        const client = new NativeAuthClient({ origin, expirySeconds: ttl });

        const bech32Address = address.value.bech32();
        const init = await client.initialize({ timestamp: Date.now() });
        console.log("init", init);
        console.log("address", bech32Address);
        const message = `${address.value}${init}`;
        const signature = await sign(bech32Address, message);
        const hexSignature = signature.toString('hex');
        console.log("stringSignature", hexSignature);
        return client.getToken(bech32Address, init, hexSignature);
    }

    const logout = async () => {
        await chrome.storage.local.remove(["wallet"]);
        signer = undefined;
        address.value = undefined;
    }

    const transactionDetail = computed(() => {
        return (transaction: Transaction) => {
            let explorer;
            switch (transaction.getChainID()) {
                case "T":
                    explorer = "https://testnet-explorer.multiversx.com";
                    break;
                case "D":
                    explorer = "https://devnet-explorer.multiversx.com";
                    break;
                default:
                    explorer = "https://explorer.multiversx.com";
                    break;
            }
            return {
                hash: transaction.getHash().hex(),
                explorer: `${explorer}/transactions/${transaction.getHash()}`
            };
        }
    })

    return { address, transactions, ttl, origin, updateWallet, load, saveWallet, sign, generateNativeToken, logout, transactionDetail, signTransactions, loadTokenConfig};
}
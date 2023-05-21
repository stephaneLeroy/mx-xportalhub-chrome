import {UserSigner} from "@multiversx/sdk-wallet";
import type {UserAddress} from "@multiversx/sdk-wallet/out/userAddress";
import {NativeAuthClient} from "@multiversx/sdk-native-auth-client";
import {computed, reactive, ref} from "vue";
import {Transaction} from "@multiversx/sdk-core";
import {Signature} from "@multiversx/sdk-wallet/out/signature";
import type {IPlainTransactionObject} from "@multiversx/sdk-core/out";

export type SignResult =  {
    transactions?: IPlainTransactionObject[],
    error?: string
}
export const useWallet = () => {
    const address = ref<UserAddress | undefined>(undefined);
    const transactions = reactive<Transaction[]>([]);
    let signer: UserSigner | undefined;

    const updateWallet = async (wallet: string)=> {
        signer = UserSigner.fromPem(wallet);
        address.value = signer.getAddress();
    }
    const load = async () => {
        const result = await chrome.storage.local.get(["wallet", "transactions"]);
        if(result.transactions) {
            transactions.splice(0);
            result.transactions
                .map((transaction: any) => Transaction.fromPlainObject(transaction))
                .forEach((transaction: Transaction) => transactions.push(transaction));
        }
        await updateWallet(result.wallet);
    }

    const saveWallet = async (wallet: string) => {
        await updateWallet(wallet);
        await chrome.storage.local.set({wallet});
    }



    const sign = async (message: Buffer) => {
        if (!signer) {
            throw new Error("Wallet not loaded");
        }
        return signer.sign(message);
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

    const generateNativeToken = async (apiUrl:string = "https://api.multiversx.com") => {
        if (!signer || !address.value) {
            throw new Error("Wallet not loaded");
        }
        const client = new NativeAuthClient({ origin: apiUrl });
        const bech32Address = address.value.bech32();
        const init = await client.initialize({ timestamp: Date.now() });
        console.log("init", init);
        console.log("address", bech32Address);
        const message = Buffer.from(`${bech32Address}${init}`);
        const signature = await sign(message);
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

    return { address, transactions, updateWallet, load, saveWallet, sign, generateNativeToken, logout, transactionDetail, signTransactions};
}
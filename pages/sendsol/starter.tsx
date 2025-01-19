import BoilerPlate from '../../components/BoilerPlate';
import  React, { useEffect, useState } from 'react';
import { Transaction, TransactionBlockhashCtor, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { toast } from 'react-toastify';
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { ExternalLinkIcon } from '@heroicons/react/outline';

const Starter = () => {
    const [account, setAccount] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);
    const [txSig, setTxSig] = useState("");

    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    async function handleTransaction() {
        if(!connection || !publicKey) return toast.error("Please connect your wallet.");
        const { blockhash, lastValidBlockHeight} = await connection.getLatestBlockhash();
        const txInfo: TransactionBlockhashCtor = {
            feePayer: publicKey,
            blockhash: blockhash,
            lastValidBlockHeight: lastValidBlockHeight
        }
        const transaction = new Transaction(txInfo);
        const instruction = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(account),
            lamports: amount * LAMPORTS_PER_SOL
        });
        transaction.add(instruction);

        try {
            const signature = await sendTransaction(transaction, connection);
            setTxSig(signature);
            const newBalance = balance - amount;
            setBalance(newBalance);
        } catch(error: any) {
            console.log({error});
            toast.error("Transaction failed!");
        }
    }

    useEffect(() => {
        const getInfo = async () => {
            if(connection && publicKey) {
                const info = await connection.getAccountInfo(publicKey);
                const balance = info!.lamports / LAMPORTS_PER_SOL;
                setBalance(balance);
            }
        }
        getInfo();
    }, [connection, publicKey])

    const outputs = [
        {
            title: "Account Balance...",
            dependency: balance,
        }, 
        {
            title: "Transaction Signature...",
            dependency: txSig,
            href: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
        }
    ];

    return (
        <main className="min-h-screen text-white max-w-7xl">
            <section className="grid grid-cols-1 sm:grid-cols-6 gap-4 p-4">
                <form className="rounded-lg min-h-content p-4 bg-[#2a302f] sm:col-span-6 lg:col-start-2 lg:col-end-6">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-2xl text-[#fa6ece]">Send Sol</h2>
                        
                        <button
                            onClick={(e) => {
                               e.preventDefault();
                               handleTransaction();     
                            }}
                            disabled={!account || !amount}
                            className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece] rounded-lg w-24 py-1 font-semibold
                                transition-all duration-200 hover:bg-transparent border-2 border-transparent hover:border-[#fa6ece]
                                `}
                        >
                            Submit
                        </button>
                    </div>

                    <div className="mt-6">
                        <h3 className="italic text-sm">Address of receiver</h3>

                        <input 
                            id="account" 
                            type="text" 
                            placeholder="Public key of receiver"
                            onChange={(event) => setAccount(event.target.value)}
                            className="text-[#9e80ff] py-1 w-full bg-transparent outline-none resize-none border-2 border-transparent border-b-white"
                        />
                    </div>

                    <div className="mt-6">
                        <h3 className="italic text-sm">Number amount</h3>

                        <input 
                            id="account" 
                            type="number" 
                            min={0}
                            placeholder="Amount of SOL"
                            onChange={(event) => setAmount(Number(event.target.value))}
                            className="text-[#9e80ff] py-1 w-full bg-transparent outline-none resize-none border-2 border-transparent border-b-white"
                        />
                    </div>

                    <div className="text-sm font-semibold mt-8 bg-[#222524] border-2 border-gray-500 rounded-lg p-2">
                        <ul className="p-2">
                            {
                                outputs.map(({title, dependency, href}, index) => (
                                    <li 
                                        key={title}
                                        className={`flex justify-between items-center ${ index !== 0 && "mt-4"}`}
                                    >
                                        <p className="tracking-wider">{title}</p>

                                        {dependency  && (
                                            <a 
                                                href={href} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className={`flex text-[#80ebff] italic ${href && "hover:text-white"} transition-all duration-200`}
                                            >
                                                {dependency.toString().slice(0, 25)}
                                                
                                                {href && <ExternalLinkIcon className="w-5 ml-1" />}
                                            </a>
                                        )}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>
                </form>
            </section>
        </main>
    )
}

export default Starter;
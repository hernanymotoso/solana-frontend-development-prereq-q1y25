import BoilerPlate from '../../components/BoilerPlate';
import React, { useState, useEffect } from 'react';
import {Transaction, TransactionBlockhashCtor } from '@solana/web3.js';
import { toast } from 'react-toastify';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ExternalLinkIcon } from '@heroicons/react/outline';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import CounterIDL from '../../programs/idls/counter.json';
import { Counter } from '../../programs/types/counter';
import { Keypair, PublicKey } from '@solana/web3.js';

const Starter = () => {
    const [counterKey, setCounterKey] = useState("");
    const [count, setCount] = useState<number>(0);
    const [txSig, setTxSig] = useState<string>("");

    const [customCount, setCustomCount] = useState<number | string>("");
    const [shouldBeClosed, setShouldBeClosed] = useState(false);
    const { connection } = useConnection();
    const { publicKey, wallet} = useWallet();
    const [isClosed, setIsClosed] = useState(false);

    const provider = new AnchorProvider(
        connection,
        wallet?.adapter as unknown as NodeWallet,
        AnchorProvider.defaultOptions()
    );
    const counterProgram = new Program(
        CounterIDL as unknown as Counter,
        provider
    );

    async function getPreparedTransaction() {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const txInfo: TransactionBlockhashCtor = {
            feePayer: publicKey,
            blockhash: blockhash,
            lastValidBlockHeight: lastValidBlockHeight,            
        };
        const transaction = new Transaction(txInfo);
        return transaction;
    }

    async function handleInitializeCounter() {
        if(!connection || !publicKey) return toast.error("Please connect your wallet.");
        const transaction = await getPreparedTransaction();
        const counterKeypair = Keypair.generate();
        const instruction = await counterProgram.methods.initialize().accounts({
            payer: publicKey,
            counter: counterKeypair.publicKey,
        }).instruction();
        transaction.add(instruction);

        try {
            const signature = await provider.sendAndConfirm(
                transaction,
                [counterKeypair],
                {
                    skipPreflight: true,
                }
            )
            setTxSig(signature);
            setCounterKey(counterKeypair.publicKey.toBase58());
        } catch(error: any){
            console.log({error});
            toast.error("Transaction failed!");
        }
    }

    async function handleIncrementCounter() {
        if(!connection || !publicKey) return toast.error("Please connect your wallet.");
        const transaction = await getPreparedTransaction();
        const instruction = await counterProgram.methods.increment().accounts({
            counter: new PublicKey(counterKey),
        }).instruction();
        transaction.add(instruction);

        try {
            const signature = await provider.sendAndConfirm(
                transaction, [], {
                    skipPreflight: true,
                }
            )
            setTxSig(signature);
        } catch(error: any){
            console.log({error});
            toast.error("Transaction failed!");
        }
    }

    async function handleDecrementCounter() {
        if(!connection || !publicKey) return toast.error("Please connect your wallet.");
        const transaction = await getPreparedTransaction();
        const instruction = await counterProgram.methods.decrement().accounts({
            counter: new PublicKey(counterKey),
        }).instruction();
        transaction.add(instruction);

        try {
            const signature = await provider.sendAndConfirm(
                transaction, [], {
                    skipPreflight: true,
                }
            )
            setTxSig(signature);
        } catch(error: any){
            console.log({error});
            toast.error("Transaction failed!");
        }
    }

    async function handleSetCustomCounter(customCount: number) {
        if(!connection || !publicKey) return toast.error("Please connect your wallet.");
        const transaction = await getPreparedTransaction();
        const instruction = await counterProgram.methods.set(customCount).accounts({
            counter: new PublicKey(counterKey),          
        }).instruction();
        transaction.add(instruction);

        try {
            const signature = await provider.sendAndConfirm(
                transaction, [], {
                    skipPreflight: true,
                }
            )
            setTxSig(signature);
            setCustomCount("");
        } catch(error: any){
            console.log({ error });
            toast.error("Transaction failed!");
        }
    }

    async function handleCloseCounter() {
        if(!connection || !publicKey) return toast.error("Please connect your wallet.");
        const transaction = await getPreparedTransaction();
        const instruction = await counterProgram.methods.close().accounts({
            payer: publicKey,
            counter: new PublicKey(counterKey),
        }).instruction();
        transaction.add(instruction);

        try {
            const signature = await provider.sendAndConfirm(transaction, [], {
                skipPreflight: true
            })
            setShouldBeClosed(true);
        } catch(error: any) {
            console.log({error});
            toast.error("Transaction failed!");
        }
    }

    const outputs = [
        {
            title: "Counter Value...",
            dependency: count,
        },
        {
            title:"Latest Transaction Signature...",
            dependency: txSig,
            href: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`
        }, 
        {
            title: "Counter Closed...",
            dependency: isClosed
        }
    ]
    
    useEffect(() => {
        const getInfo = async () => {
            if(connection && publicKey && counterKey) {
                try{
                    const currentAccount = await counterProgram.account.counter.fetch(new PublicKey(counterKey));
                    setCount(currentAccount.count);
                }catch(error: any) {
                    console.log({error});
                } 
            }
        };
        getInfo();
    }, [connection, publicKey, counterKey, txSig]);

    useEffect(() => {
        const getInfo = async () => {
            if(connection && publicKey && counterKey && shouldBeClosed) {
                try {
                    const userAccount = await counterProgram.account.counter.fetchNullable(
                        new PublicKey(counterKey)
                    );
                    setIsClosed(userAccount === null);
                } catch(error: any) {
                    console.log({error});
                }
            }
        }
        getInfo();
    }, [connection, publicKey, counterKey, shouldBeClosed, txSig]);
    
    return(
       <main className="min-h-screen text-white max-w-7xl">
            <section className="grid grid-cols-1 sm:grid-cols-6 gap-4 p-4">
                <form className="rounded-lg min-h-content p-4 bg-[#2a302f] sm:col-span-6 lg:col-start-2 lg:col-end-6">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-2xl text-[#fa6ece]">Create Counter</h2>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleInitializeCounter();
                            }}
                            disabled={!publicKey}
                            className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece]
                                rounded-lg w-auto py-1 font-semibold transition-all duration-200 hover:bg-transparent border-2 border-transparent hover:border-[#fa6ece]
                            `}
                            
                        >
                            Initialize Counter
                        </button>

                        {counterKey && (
                            <p className="text-sm text-gray-400">Counter Key: {counterKey}</p>
                        )}
                        
                        <div className="flex w-full gap-2">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDecrementCounter();
                                }}
                                disabled={!publicKey || !counterKey || count === 0 || shouldBeClosed} 
                                className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece]
                                    rounded-lg w-full py-1 px-2 font-semibold transition-all duration-200 hover:bg-transparent border-2 border-transparent hover:border-[#fa6ece]
                                `}
                            >
                                Decrement Counter
                            </button>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleIncrementCounter();
                                }}
                                disabled={!publicKey || !counterKey || shouldBeClosed}
                                className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#7159c1] bg-[#7159c1]
                                    rounded-lg w-full py-1 px-2 font-semibold transition-all duration-200 hover:bg-transparent border-2 border-transparent hover:border-[#7159c1]    
                                `}
                            >
                                Increment Counter
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col mt-8">
                        <div>
                            <h3 className="italic text-sm">Number amount</h3>

                            <input 
                                id=""
                                type="number"
                                placeholder="Counter value"
                                value={customCount}
                                onChange={(e) => setCustomCount(Number(e.target.value))}
                                className="text-[#9e80ff] py-1 w-full bg-transparent outline-none resize-none border-2 border-transparent border-b-white"        
                            />
                        </div>

                        <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSetCustomCounter(+customCount);
                                }}
                                disabled={!publicKey || !counterKey || (customCount === 0 || !customCount) || shouldBeClosed}
                                className={`mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#7159c1] bg-[#7159c1]
                                    rounded-lg w-full py-1 px-2 font-semibold transition-all duration-200 hover:bg-transparent border-2 border-transparent hover:border-[#7159c1]    
                                `}
                            >
                                Set Value
                            </button>
                    </div>

                    <div className="flex flex-col mt-8">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                handleCloseCounter();
                            }}
                            disabled={!publicKey || !counterKey || shouldBeClosed}
                            className={`mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece]
                                rounded-lg w-full py-1 px-2 font-semibold transition-all duration-200 hover:bg-transparent border-2 border-transparent hover:border-[#fa6ece]    
                            `}
                            
                        >
                            Close Counter
                        </button>
                    </div>

                    <div className="text-sm font-semibold mt-8 bg-[#222524] border-2 border-gray-500 rounded-lg p-2">
                        <ul className="p-2">
                            {outputs.map(({title, dependency, href}, index) => (
                                <li
                                    key={title}
                                    className={`flex justify-between items-center ${index !== 0 && "mt-4"}`}
                                >
                                    <p className="tracking-wider">{title}</p>

                                    {dependency && (
                                        <a 
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex text-[#80ebff] italic ${ href && "hover:text-white"}
                                                transition-all duration-200
                                            `}
                                        >
                                            { typeof dependency === "boolean" ? dependency ? "true" : "false" : dependency.toString().slice(0, 25) }
                                            {href && <ExternalLinkIcon className="w-5 ml-1" />}
                                        </a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </form>
            </section>
       </main>
    )
} 

export default Starter;
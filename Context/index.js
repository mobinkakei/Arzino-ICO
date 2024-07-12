import React, {useState, useContext, createContext, useEffect} from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import toast from "react-hot-toast";

//INTERNAL
import {
    handleNetworksSwitch, 
    shortenAddress, 
    ICO_MARKETPLACE_ADDRESS, 
    ICO_MARKETPLACE_CONTRACT
} from "./constants";

const StateContext = createContext();

export const  StateContextProvider = ({children})=> {
    // State var 
    const [address, setAddress] = useState();
    const [accountBalance, setAccountBalance] = useState(null);
    const [loader, setLoader] = useState(false);
    const [reCall, setReCall] = useState(0);
    const [currency, setCurrency] = useState("MATIC");

    //COMPONENT
    const [openBuyToken, set0penBuyToken] = useState(false);
    const [openWidthdrawToken, setOpenWidthdrawToken] = useState(false);
    const [openTransferToken, setOpenTransferToken] = useState(false);
    const [openTokenCreator, set0penTokenCreator] = useState(false);
    const [openCreateICO, set0penCreateIC0] = useState(false);

    const notifySuccess = (msg) => toast.success(msg, {duration: 200});
    const notifyError = (msg) => toast.error(msg, {duration: 200})
    
    const checkIfWalletConnected = async () => {
        try {
            if(!window.ethereum) return notifyError("هیچ حسابی یافت نشد.");
            const accounts = await window.ethereum.request({
                method: "eth_accounts", 
            });
            
            if(accounts.length) {
                setAddress(accounts[0]);
                const provider = new ethers.providers.Web3Provider(connection);
                const getbalance = await provider.getBalance(accounts[0]);
                const balance = ethers.utils.formatEther(getbalance);
                setAccountBalance(balance);
                return accounts[0];
            } else {
                notifyError("هیچ حسابی یافت نشد.")
            }
        } catch (error) {
           console.log(error); 
        }
    }

    const connectWallet = async () => {
        try {
            if(!window.ethereum) return notifyError("هیچ حسابی یافت نشد.");
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts", 
            });
            
            if(accounts.length) {
                setAddress(accounts[0]);
                const provider = new ethers.providers.Web3Provider(connection);
                const getbalance = await provider.getBalance(accounts[0]);
                const balance = ethers.utils.formatEther(getbalance);
                setAccountBalance(balance);
                return accounts[0];
            } else {
                notifyError("هیچ حسابی یافت نشد.")
            }
        } catch (error) {
           console.log(error); 
        }
    }

    //Main Func
    const GET_ALL_ICOSALE_TOKEN = async()=> {
        try {
            setLoader(true);
            const address = await connectWallet();
            const contract = await ICO_MARKETPLACE_CONTRACT();

            if(address){
                const allICOSaleToken = await contract.getAllTokens();

                const _tokenArray = Promise.all(
                    allICOSaleToken.map(async(token)=> {
                        const tokenContract = await TOKEN_CONTRACT(token?.token);

                        const balance = await tokenContract.balanceOf(ICO_MARKETPLACE_ADDRESS);

                        return {
                            creator: token.creator,
                            token: token.token,
                            name: token.name,
                            symbol: token.symbol,
                            supported: token.supported,
                            price: ethers.utils.formatEther(token?.prive.toString()),
                            icoSaleBal: ethers.utils.formatEther(balance.toString()),
                        }; 
                    })
                );

                setLoader(false);
                return _tokenArray;
            }
        } catch (error) {
            notifyError("خطای مهمی رخ داده است، لطفا با تیم فنی تماس بگیرید!")
            console.log(error)
        }
    }

    const GET_ALL_USER_ICOSALE_TOKEN = async()=> {
        try {
            setLoader(true);
            const address = await connectWallet();
            const contract = await ICO_MARKETPLACE_CONTRACT();

            if(address){
                const allICOSaleToken = await contract.getTokenCreatedBy(address);

                const _tokenArray = Promise.all(
                    allICOSaleToken.map(async(token)=> {
                        const tokenContract = await TOKEN_CONTRACT(token?.token);

                        const balance = await tokenContract.balanceOf(ICO_MARKETPLACE_ADDRESS);

                        return {
                            creator: token.creator,
                            token: token.token,
                            name: token.name,
                            symbol: token.symbol,
                            supported: token.supported,
                            price: ethers.utils.formatEther(token?.prive.toString()),
                            icoSaleBal: ethers.utils.formatEther(balance.toString()),
                        }; 
                    })
                );

                setLoader(false);
                return _tokenArray;
            }
        } catch (error) {
            notifyError("خطای مهمی رخ داده است، لطفا با تیم فنی تماس بگیرید!")
            console.log(error)
        }
    }

    const createICOSALE = async(icoSale)=> {
        try {
            const {address, price} = icoSale;
            if (!address | !price) return notifyError("لطفا اطلاعات را وارد کنید");

            setLoader(true);
            notifySuccess("در حال پردازش ...");
            await connectWallet();

            const contract = await ICO_MARKETPLACE_CONTRACT();

            const payAmount = ethers.utils.parseUnits(price.toString(), "ethers");

            const transaction = await contract.CreateICOSale(address, payAmount, {
                gasLimit: ethers.utils.hexlify(8000000),
            });

            await transaction.wait();

            if(transaction.hash){
                setLoader(false);
                set0penCreateIC0(false);
                setReCall(reCall + 1);
            }
        } catch (error) {
            setLoader(false);
            set0penCreateIC0(false);
            notifyError("خطای مهمی رخ داده است لطفا با تیم فنی تماس بگیرید !")
            console.log(error)
        }
    }

    const buyToken = async(tokenAddress, tokenQuantity)=> {
        try {
            setLoader(true);
            notifySuccess("درحال پردازش ...");

            const address = await connectWallet();
            const contract = await ICO_MARKETPLACE_CONTRACT();

            const _tokenBalance = await contract.getBalance(tokenAddress);
            const _tokenDetails = await contract.getTokendetails(tokenAddress);

            const avalableToken = ethers.utils.formatEther(_tokenBalance.toString());
            if(avalableToken > 0){
                const price = ethers.utils.formatEther(_tokenDetails.price.toString()) * Number(tokenQuantity);
                const payAmount = ethers.utils.parseUnits(price.toString(), "ether");
                const transaction = await contract.buyToken(
                    tokenAddress,
                    Number(tokenQuantity),
                    {
                        value: payAmount.toString(),
                        gasLimit: ethers.utils.hexlify(8000000),
                    }
                );
                await transaction.wait();
                setLoader(false);
                setReCall(reCall + 1);
                set0penBuyToken(false);
                notifySuccess("عملیات با موفقیا انجام شد.");
            } else { 
                setLoader(false);
                set0penBuyToken(false);
                notifyError("موجودی کافی نیست")
            }
        } catch (error) {
            console.log(error)
        }
    }

    const transferToken = async(transferTokenData)=> {
        try {
            if(!transferTokenData.address || !transferTokenData.amount || !transferTokenData.tokenAdd) 
            return notifyError("لطفا اطلاعات را وارد کنید !");
            
            setLoader(true);
            notifySuccess("پردازش اطلاعات ...");
            const address = await connectWallet();
            const contract = await ICO_MARKETPLACE_CONTRACT();
            const _avalableBal = await contract.balanceOf(address);
            const avalableToken = ethers.utils.formatEther(_avalableBal.toString());

            if(avalableToken > 1){
                const payAmount = ethers.utils.parseUnits(
                    transferTokenData.amount.toString(),    
                        "ethers" 
                );
                const transaction = await contract.transfer(
                    transferToken.address, payAmount, {
                        gasLimit: ethers.utils.hexlify(8000000),
                    }
                );
                await transaction.wait();
                setLoader(false);
                setReCall(reCall + 1);
                setOpenTransferToken(false);
                notifySuccess("علمیات با موفیقت انجام شد !");
            } else {
                setLoader(false);
                setReCall(reCall + 1);
                setOpenTransferToken(false);
                notifyError("موجودی شما کافی نیست !");
            }
        } catch (error) {
            setLoader(false);
            setReCall(reCall + 1);
            setOpenTransferToken(false);
            notifyError("خطایی رخ داده است لطفا با تیم فنی تماس بگیرید");
            console.log(error)
        }
    }

    const widthdrawToken = async(widthdrawQuantity)=> {
        try {
            if(!widthdrawQuantity.amount || !widthdrawQuantity.token)
              return notifyError("لطفا اطلاعات را وارد کنید !")
            
            setLoader(true);
            notifySuccess("در حال پردازش ...");

            const address = await connectWallet();
            const contract = await ICO_MARKETPLACE_CONTRACT();

            const payAmount = ethers.utils.parseUnits(
                widthdrawQuantity.amount.toString(), 
                "ether"
            );

            const transaction = await contract.withdraw(widthdrawQuantity.token, payAmount,{
                gasLimit: ethers.utils.hexlify(8000000),
            });

            await transaction.wait();
            setLoader(false);
            setReCall(reCall + 1);
            setOpenWidthdrawToken(false);
            notifySuccess("عملیات با موفقیت انجام شد !");
        } catch (error) {
            setLoader(false);
            setReCall(reCall + 1);
            setOpenWidthdrawToken(false);
            notifyError("خطای مهمی رخ داده است، لطفا با تیم فنی تماس بگیرید!");
        }
    }

    return <StateContext.Provider value={{}}>{children}</StateContext.Provider>;
};

export const useStateContext = () => useContext(StateContext);
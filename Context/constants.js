import {Signer, ethers} from "ethers";
import Web3Modal from "web3modal";
import icoMarketplace from "icoMarketplace.json";

export const ICO_MARKETPLACE_ADDRESS = process.env.NEXT_PUBLIC_ICO_MARKETPLACE_ADDRESS;
export const ICO_MARKETPLACE_ABI = icoMarketplace.abi;

// NETWORKS opitional
const networks = {
    polygon_amoy: {
        chainId: `0x${Number(80002).toString(16)}`,
        chainName: "Polygon Amoy",
        nativeCurrency: {
            name: "MATIC",
            symbol: "MATIC",
            decimals: 18,
        },
        rpcUrls: ["https://rpc-amoy.polygon.technology/"],
        blockExplorerUrls: ["https://www.oklink.com/amoy"],
    },
}

const changeNetwork = async({networkName}) => {
    try {
        if(!window.ethereum) throw new Error("کیف پولی یافت نشد !")
        await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    ...networks[networkName],
                },
            ],
        });
    } catch (error) {
        console.log(error);
    }
}

export const handleNetworksSwitch= async()=> {
    const networkName = " polygon_amoy";
    await changeNetwork({networkName});
};

export const shortenAddress = (address)=> `${address?.slice(0, 5)}...${address?.slice(address.length -4)}`;

// CONTRACT FETCH
const fetchContract = (address, abi, signer) => new ethers.Contract(address, abi, signer);

export const ICO_MARKETPLACE_CONTRACT = async()=> {
    try {
        const web3Modal = new Web3Modal();
        const connection = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();

        const contract = fetchContract(
            ICO_MARKETPLACE_ADDRESS,
            ICO_MARKETPLACE_ABI,
            signer
        );
        
        return contract;
    } catch (error) {
        console.log(error)
    }
}


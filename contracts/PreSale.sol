// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns(bool);
    function balanceOf(address account) external view returns(uint256);
    function symbol() external view returns(string memory);
    function totalSupply() external view returns(uint256);
    function name() external view returns(string memory);
}

contract ICOMarketPlace {
    struct TokenDetails {
        address token;
        bool supported;
        uint256 price;
        address creator;
        string name;
        string symbol;
    }

    //MAP
    mapping (address => TokenDetails) public TokenDetailsMap; // Renamed to avoid conflict with struct name
    address[] public allsupportedTokens;
    address public owner;

    //Events 
    event TokenRecieved(address indexed token, address indexed from, uint256 amount);
    event TokenTransfered(address indexed token, address indexed to, uint256 amount);
    event TokenWithdraw(address indexed token, address indexed to, uint256 amount);
    event TokenAdded(address indexed token, uint256 price, address indexed creator, string name, string symbol);

    //Modifiers
    modifier supportedToken(address _token){
        require(TokenDetailsMap[_token].supported, "Token Not Supported");
        _;
    }

    modifier onlyOwner(){
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    modifier onlyCreator(address _token){
        require(msg.sender == TokenDetailsMap[_token].creator, "Caller is not the creator");
        _;
    }
    
    receive() external payable{
        revert("Contract doesn't accept ETH directly");
    }

    constructor(){
        owner = msg.sender;
    }

    //Contract Funcs 
    function CreateICOSale(address _token, uint256 _price) external {
        IERC20 token = IERC20(_token);
        string memory tokenName = token.name();
        string memory tokenSymbol = token.symbol();

        TokenDetailsMap[_token] = TokenDetails({
            token: _token,
            supported: true,
            price: _price,
            creator: msg.sender,
            name: tokenName,
            symbol: tokenSymbol
        });
        allsupportedTokens.push(_token);

        emit TokenAdded(_token, _price, msg.sender, tokenName, tokenSymbol);
    }

    function multiply(uint256 x, uint256 y) internal pure  returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x);
    }

    function buyToken(address _token, uint256 _amount) external payable supportedToken(_token){
        require(_amount > 0, "Amount must be greater than 0");

        TokenDetails memory details = TokenDetailsMap[_token];
        uint256 totalCost = multiply(details.price, _amount);
        require(msg.value == totalCost, "Incorrect Ether amount sent");

        //Transfer 
        (bool sent,) = details.creator.call{value: msg.value}("");
        require(sent, "Failed to transfer Ether to Token");
        IERC20 token = IERC20(_token);
        require(token.transfer(msg.sender, _amount * 10**18),  "Transfer Failed");

        emit TokenTransfered(_token, msg.sender, _amount);
    }

    function getBalance(address _token) external view  returns (uint256){
        require(TokenDetailsMap[_token].supported, "Token Not Supported");

        IERC20 token = IERC20(_token);
        return token.balanceOf(address(this));
    }

    function getsupportedToken() external view returns(address[] memory){
        return allsupportedTokens;
    }
    
    function withdraw(address _token, uint256 _amount) external onlyCreator(_token) supportedToken(_token){
        require(_amount > 0, "Amount Must be greater than 0");
        IERC20 token = IERC20(_token);
        uint256 balance = token.balanceOf(address(this));
        require(balance <= _amount, "Invalid Balance");
        require(token.transfer(msg.sender, _amount), "Token Transfer failed");

        emit TokenWithdraw(_token, msg.sender, _amount);
    }

    function getTokendetails(address _token) external view returns(TokenDetails memory){
        require(TokenDetailsMap[_token].supported, "Token Not Supported");

        return TokenDetailsMap[_token];
    }
    
    function getTokenCreatedBy(address _creator) external view returns(TokenDetails[] memory){
        uint256 count = 0;
        for (uint256 i = 0; i < allsupportedTokens.length; i++){
            if(TokenDetailsMap[allsupportedTokens[i]].creator == _creator){
                count++; // Added missing semicolon
            }
        }

        TokenDetails[] memory tokens = new TokenDetails[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < allsupportedTokens.length; i++){
            if(TokenDetailsMap[allsupportedTokens[i]].creator == _creator){
                tokens[index] = TokenDetailsMap[allsupportedTokens[i]];
                index++;
            }
        }

        return tokens;
    }

    function getAllTokens() external view returns(TokenDetails[] memory){
        uint256 length = allsupportedTokens.length;

        TokenDetails[] memory tokens = new TokenDetails[](length);
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = TokenDetailsMap[allsupportedTokens[i]];
        }
        
        return tokens;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Dragonlore is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("Dragonlore", "DLR") {}

    function _baseURI() internal pure override returns (string memory) {
        return "http://localhost:3009/csgonft/";
    }

    event Beg();
    event BegSafeMint(address to, uint256 tokenId);

    function safeMint(address to) public onlyOwner {
        emit Beg();
        uint256 tokenId = _tokenIdCounter.current();
        emit BegSafeMint(to, tokenId);
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }
}
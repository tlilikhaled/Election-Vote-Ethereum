pragma solidity ^0.5.0;
contract Election {
  // Read/write candidate
  string public candidate;
// Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
}

    // Read/write Candidates
    mapping(uint => Candidate) public candidates;
    uint public candidatesCount;
    // Store accounts that have voted
mapping(address => bool) public voters;
event votedEvent (
        uint indexed _candidateId
    );




   // Constructor
  constructor() public {
   addCandidate("Candidate 1");
   addCandidate("Candidate 2");

   }

   function addCandidate (string memory _name) public {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

   function vote (uint _candidateId) public {
    // require that they haven't voted before
    require(!voters[msg.sender]);

    // require a valid candidate
    require(_candidateId > 0 && _candidateId <= candidatesCount);

    // record that voter has voted
    voters[msg.sender] = true;

    // update candidate vote Count
    candidates[_candidateId].voteCount ++;

    // trigger voted event
   emit votedEvent(_candidateId);
}




}

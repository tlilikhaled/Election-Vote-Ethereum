var allowedAccounts;

App = {
  web3Provider: null,
  contracts: {},
  account: "0x0",
  init: function () {
    return App.initWeb3();
  },
  initWeb3: function () {
    const metaProvider = web3.currentProvider;
    App.web3Provider = metaProvider;
    web3 = new Web3(web3.currentProvider);
    App.loadAccountData();

    App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    web3 = new Web3(App.web3Provider);

    web3.eth.getAccounts((err, accounts) => {
      allowedAccounts = accounts.slice(0, 2);
      console.log(allowedAccounts);
      App.web3Provider = metaProvider;
      web3 = new Web3(web3.currentProvider);
    });

    ethereum.on("accountsChanged", (a) => {
      App.account = a[0];
      App.updateAccountSection();
      App.render();
    });
    return App.initContract();
  },
  initContract: function () {
    $.getJSON("Election.json", function (election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);
      return App.render();
    });
  },
  loadAccountData: function () {
    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        App.updateAccountSection();
      }
    });
  },
  updateAccountSection: function () {
    var accountSection = $("#account-section");
    accountSection.empty();
    accountSection.append(
      '<p id="accountAddress">Your Account:' +
        "<strong>" +
        App.account +
        "</strong></p>"
    );
    if (allowedAccounts.includes(App.account)) {
      accountSection.append(
        '<button type="button" class="btn btn-primary" data-toggle="modal" data-target="#addModal">' +
          "Add Condidate" +
          "</button>"
      );
    }
  },
  render: function () {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    loader.show();
    content.hide();
    // Load contract data
    App.contracts.Election.deployed()
      .then(function (instance) {
        electionInstance = instance;
        return electionInstance.candidatesCount();
      })
      .then(function (candidatesCount) {
        var candidatesResults = $("#candidatesResults");
        candidatesResults.empty();
        var candidatesSelect = $("#candidatesSelect");
        candidatesSelect.empty();
        for (var i = 1; i <= candidatesCount; i++) {
          electionInstance.candidates(i).then(function (candidate) {
            var id = candidate[0];
            var name = candidate[1];
            var voteCount = candidate[2];
            // Render candidate Result
            var candidateTemplate =
              "<tr><th>" +
              id +
              "</th><td>" +
              name +
              "</td><td>" +
              voteCount +
              "</td></tr>";
            candidatesResults.append(candidateTemplate);
            candidatesSelect.append(
              "<option value='" + id + "'>" + name + "</option>"
            );
          });
        }
        return electionInstance.voters(App.account);
      })
      .then((hasVoted) => {
        $("#vote-form").show();
        if (hasVoted) {
          $("#vote-form").hide();
        }
        loader.hide();
        content.show();
      })
      .catch(function (error) {
        console.warn(error);
      });

    $("#submit-btn").attr("disabled", "disabled");

    $("#nameInput").on("input", () => {
      if ($("#nameInput").val() !== "") {
        $("#submit-btn").removeAttr("disabled");
      } else {
        $("#submit-btn").attr("disabled", "disabled");
      }
    });
  },
  castVote: function () {
    var candidateId = $("#candidatesSelect").val();
    App.contracts.Election.deployed()
      .then((instance) => {
        return instance.vote(candidateId, { from: App.account });
      })
      .then(() => {
        App.render();
      })
      .catch((err) => {
        console.error(err);
      });
  },
  addCandidate: function () {
    var name = $("#nameInput").val();
    App.contracts.Election.deployed()
      .then((instance) => {
        return instance.addCandidate(name, { from: App.account });
      })
      .then(() => {
        App.render();
        $("#addModal").modal("hide");
        $("#nameInput").val("");
      })
      .catch((err) => {
        console.error(err);
      });
  },
};
$(function () {
  $(window).load(function () {
    App.init();
  });
});
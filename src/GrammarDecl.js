'use strict';

// --------------------------------------------------------------------
// Imports
// --------------------------------------------------------------------

var Grammar = require('./Grammar');
var common = require('./common');
var errors = require('./errors');
var pexprs = require('./pexprs');

// --------------------------------------------------------------------
// Private Stuff
// --------------------------------------------------------------------

// Constructors

function GrammarDecl(name) {
  this.name = name;
}

// Helpers

function onOhmError(doFn, onErrorFn) {
  try {
    doFn();
  } catch (e) {
    if (e instanceof errors.Error) {
      onErrorFn(e);
    } else {
      throw e;
    }
  }
}

GrammarDecl.prototype.ensureSuperGrammar = function() {
  if (!this.superGrammar) {
    this.withSuperGrammar(
        // TODO: The conditional expression below is an ugly hack. It's kind of ok because
        // I doubt anyone will ever try to declare a grammar called `BuiltInRules`. Still,
        // we should try to find a better way to do this.
        this.name === 'BuiltInRules' ?
            Grammar.ProtoBuiltInRules :
            Grammar.BuiltInRules);
  }
  return this.superGrammar;
};

GrammarDecl.prototype.installOverriddenOrExtendedRule = function(name, formals, body) {
  var duplicateParameterNames = common.getDuplicates(formals);
  if (duplicateParameterNames.length > 0) {
    throw new errors.DuplicateParameterNames(name, duplicateParameterNames, body);
  }
  var baseRule = this.ensureSuperGrammar().ruleDict[name];
  if (formals.length !== baseRule.formals.length) {
    throw new errors.WrongNumberOfParameters(name, baseRule.formals.length, formals.length, body);
  }
  return this.install(name, formals, baseRule.description, body);
};

GrammarDecl.prototype.install = function(name, formals, description, body) {
  body = body.introduceParams(formals);
  body.formals = formals;
  body.description = description;
  this.ruleDict[name] = body;
  return this;
};

// Stuff that you should only do once

GrammarDecl.prototype.withSuperGrammar = function(superGrammar) {
  if (this.superGrammar) {
    throw new Error('the super grammar of a GrammarDecl cannot be set more than once');
  }
  this.superGrammar = superGrammar;
  this.ruleDict = Object.create(superGrammar.ruleDict);

  // Grammars with an explicit supergrammar inherit a default start rule.
  if (!superGrammar.isBuiltIn()) {
    this.defaultStartRule = superGrammar.defaultStartRule;
  }
  return this;
};

GrammarDecl.prototype.withDefaultStartRule = function(ruleName) {
  this.defaultStartRule = ruleName;
  return this;
};

// Creates a Grammar instance, and if it passes the sanity checks, returns it.
GrammarDecl.prototype.build = function() {
  var grammar =
      new Grammar(this.name, this.ensureSuperGrammar(), this.ruleDict, this.defaultStartRule);
  // TODO: change the pexpr.prototype.assert... methods to make them add
  // exceptions to an array that's provided as an arg. Then we'll be able to
  // show more than one error of the same type at a time.
  // TODO: include the offending pexpr in the errors, that way we can show
  // the part of the source that caused it.
  var grammarErrors = [];
  var grammarHasInvalidApplications = false;
  Object.keys(grammar.ruleDict).forEach(function(ruleName) {
    var body = grammar.ruleDict[ruleName];
    onOhmError(
        function() { body.assertChoicesHaveUniformArity(ruleName); },
        function(e) { grammarErrors.push(e); });
    onOhmError(
        function() { body.assertAllApplicationsAreValid(ruleName, grammar); },
        function(e) {
          grammarErrors.push(e);
          grammarHasInvalidApplications = true;
        });
  });
  if (!grammarHasInvalidApplications) {
    // The following check can only be done if the grammar has no invalid applications.
    Object.keys(grammar.ruleDict).forEach(function(ruleName) {
      var body = grammar.ruleDict[ruleName];
      onOhmError(
          function() { body.assertIteratedExprsAreNotNullable(grammar, ruleName); },
          function(e) { grammarErrors.push(e); });
    });
  }
  if (grammarErrors.length > 0) {
    errors.throwErrors(grammarErrors);
  }
  return grammar;
};

// Rule declarations

GrammarDecl.prototype.define = function(name, formals, body, optDescr) {
  this.ensureSuperGrammar();
  if (this.superGrammar.ruleDict[name]) {
    throw new errors.DuplicateRuleDeclaration(name, this.name, this.superGrammar.name, body);
  } else if (this.ruleDict[name]) {
    throw new errors.DuplicateRuleDeclaration(name, this.name, this.name, body);
  }
  var duplicateParameterNames = common.getDuplicates(formals);
  if (duplicateParameterNames.length > 0) {
    throw new errors.DuplicateParameterNames(name, duplicateParameterNames, body);
  }
  return this.install(name, formals, optDescr, body);
};

GrammarDecl.prototype.override = function(name, formals, body) {
  var baseRule = this.ensureSuperGrammar().ruleDict[name];
  if (!baseRule) {
    throw new errors.CannotOverrideUndeclaredRule(name, this.superGrammar.name, body);
  }
  this.installOverriddenOrExtendedRule(name, formals, body);
  return this;
};

GrammarDecl.prototype.extend = function(name, formals, body) {
  var baseRule = this.ensureSuperGrammar().ruleDict[name];
  if (!baseRule) {
    throw new errors.CannotExtendUndeclaredRule(name, this.superGrammar.name, body);
  }
  this.installOverriddenOrExtendedRule(
      name, formals, new pexprs.Extend(this.superGrammar, name, body));
  return this;
};

// --------------------------------------------------------------------
// Exports
// --------------------------------------------------------------------

module.exports = GrammarDecl;

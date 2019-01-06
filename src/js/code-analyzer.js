import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let functionVariables;
let localVariables;
let change;
let node;
let edge;
let count;
let prev;
let green;
let ifExist;

const parseCode = (codeToParse, vars) => {
    localVariables = new Map();
    functionVariables = vars;
    change = false;
    prev = '';
    node = '';
    edge = '';
    count = 0;
    green = true;
    ifExist = false;
    let res = escodegen.generate(parseCodeNew(esprima.parseScript(codeToParse)), {verbatim : 'paint'});
    if (!ifExist)
        node = node.replace(/\| green/g, '');
    return [res, node + '\n' + edge];
};

const parseCodeNew = (codeToParse) => {
    if (codeToParse != null) {
        return typeFind(codeToParse.type)(codeToParse);
    }
    return null;
};

const parseProgram = (codeToParse) => {
    let code = codeToParse;
    let arr = [];
    codeToParse.body.forEach(function (element) {
        let temp = parseCodeNew(element);
        arr.push(temp);
    });
    code.body = arr;
    return code;
};

const parseFunctionDeclaration = (codeToParse) => {
    let code = codeToParse;
    code.body = parseCodeNew(codeToParse.body);
    return code;
};

const parseBlockStatement = (codeToParse) => {
    let code = codeToParse;
    let arr = [];
    codeToParse.body.forEach(function (element) {
        let temp = parseCodeNew(element);
        arr.push(temp);
    });
    code.body = arr;
    return code;
};

const parseVariableDeclaration = (codeToParse) => {
    let code = codeToParse;
    let dec = 'op' + count++;
    let op = dec + '=>operation: ' + escodegen.generate(codeToParse);
    if (green)
        op = op + ' | green';
    node = node + op + '\n';
    connectOperation(dec);
    let i = 0;
    let tempCode = esprima.parseScript(escodegen.generate(codeToParse)).body[0];
    change = true;
    codeToParse.declarations.forEach(function (element) {
        let temp = substitute(tempCode.declarations[i].init);
        localVariables.set(element.id.name, temp);
        i++;
    });
    change = false;
    return code;
};

const parseExpressionStatement = (codeToParse) => {
    let code = codeToParse;
    let exp = 'op' + count++;
    let op = exp + '=>operation: ' + escodegen.generate(codeToParse);
    if (green)
        op = op + ' | green';
    if (!change) {
        node = node + op + '\n';
        connectOperation(exp);
    }
    code.expression = substitute(codeToParse.expression);
    return code;
};

const parseWhileStatement = (codeToParse) => {
    let code = codeToParse;
    let cond = 'op' + count++;
    let op = cond + '=>condition: ' + escodegen.generate(codeToParse.test);
    if (green)
        op = op + ' | green';
    node = node + op + '\n';
    connectConditionYes(cond);
    code.test = substitute(codeToParse.test);
    code.body = parseCodeNew(codeToParse.body);
    connectOperation(cond);
    prev = cond + '(no)';
    return code;
};

const parseIfStatement = (codeToParse) => {
    let superGreen = green;
    ifExist = true;
    let tempFunc = new Map(functionVariables);
    let tempLoc = new Map(localVariables);
    let code = codeToParse;
    let testNode = 'op' + count++;
    let op = 'op' + count++;
    code.test = substitute(codeToParse.test);
    if (green) {
        code = colorIf(codeToParse);
        if (green)
            node = node + testNode + '=>condition: ' + escodegen.generate(codeToParse.test) + ' | green\n';
        else
            node = node + testNode + '=>condition: ' + escodegen.generate(codeToParse.test) + '\n';
    }
    else
        node = node + testNode + '=>condition: ' + escodegen.generate(codeToParse.test) + '\n';
    return parseIfStatementConAndAlt(codeToParse, testNode, code, op, superGreen, tempFunc, tempLoc);
};

const parseIfStatementConAndAlt = (codeToParse, testNode, code, op, superGreen, tempFunc, tempLoc) => {
    connectConditionYes(testNode);
    code.consequent = parseCodeNew(codeToParse.consequent);
    connectOperation(op);
    if (superGreen) {
        green = !green;
        node = node + op + '=>operation: null | green\n';
    }
    else
        node = node + op + '=>operation: null\n';
    functionVariables = tempFunc;
    localVariables = tempLoc;
    prev = testNode + '(no)';
    code.alternate = parseCodeNew(codeToParse.alternate);
    connectOperation(op);
    functionVariables = tempFunc;
    localVariables = tempLoc;
    green = superGreen;
    return code;
};

const colorIf = (codeToParse) =>{
    let code = codeToParse;
    let str = escodegen.generate(codeToParse.test);
    let temp = esprima.parseScript(str);
    change = true;
    let str2 = escodegen.generate(parseCodeNew(temp));
    count--;
    change = false;
    if (eval(str2)) {
        code.test.paint = '<green>' + escodegen.generate(code.test) + '</green>';
        green = true;
    }
    else {
        code.test.paint = '<red>' + escodegen.generate(code.test) + '</red>';
        green = false;
    }
    return code;
};

const parseReturnStatement = (codeToParse) => {
    let code = codeToParse;
    let ret = 'op' + count++;
    node = node +ret + '=>operation: ' + escodegen.generate(codeToParse) + ' | green';
    connectOperation(ret);
    code.argument = substitute(codeToParse.argument);
    return code;
};

const substitute = (expression) => {
    return substituteFind(expression.type)(expression);
};

const substituteLiteral = (expression) => {
    return expression;
};

const substituteIdentifier = (expression) => {
    if (functionVariables.has(expression.name)){
        if (change){
            return functionVariables.get(expression.name);
        }
        else {
            return expression;
        }
    }
    if (change)
        return localVariables.get(expression.name);
    return expression;
};

const substituteBinaryExpression = (expression) => {
    let exp = expression;
    exp.left = substitute(expression.left);
    exp.right = substitute(expression.right);
    return exp;
};

const substituteUnaryExpression = (expression) => {
    let exp = expression;
    exp.argument = substitute(expression.argument);
    return exp;
};

const substituteArrayExpression = (expression) => {
    let exp = expression;
    let elements = [];
    expression.elements.forEach(function (element) {
        elements.push(substitute(element));
    });
    exp.elements = elements;
    return exp;
};

const substituteMemberExpression = (expression) => {
    let exp = expression;
    exp.property = substitute(expression.property);
    return exp;
};

const substituteUpdateExpression = (expression) => {
    let operator = '-';
    if (expression.operator === '++'){
        operator = '+';
    }
    let arg;
    if (localVariables.has(expression.argument.name)){
        arg = expression.argument;
        localVariables.set(expression.argument.name, {type : 'BinaryExpression', operator : operator,
            left : localVariables.get(arg.name), right : {type : 'Literal', value : 1, raw : '1'}});
    }
    else {
        arg = expression.argument;
        functionVariables.set(expression.argument.name, {type : 'BinaryExpression', operator : operator,
            left : functionVariables.get(arg.name), right : {type : 'Literal', value : 1, raw : '1'}});
    }
    return expression;
};

const substituteSequenceExpression = (expression) => {
    let exp = expression;
    let expressions = [];
    expression.expressions.forEach(function (element) {
        let temp = substitute(element);
        expressions.push(temp);
    });
    exp.expressions = expressions;
    return exp;
};

const substituteAssignmentExpression = (expression) => {
    if (expression.left.type === 'MemberExpression'){
        return substituteAssignmentExpressionMember(expression);
    }
    else {
        let exp = expression;
        let temp = escodegen.generate(exp.right);
        if (functionVariables.has(exp.left.name)){
            change = true;
            functionVariables.set(exp.left.name, substitute(esprima.parseScript(temp).body[0].expression));
            change = false;
        }
        else {
            change = true;
            localVariables.set(exp.left.name, substitute(esprima.parseScript(temp).body[0].expression));
            change = false;
        }
        return expression;
    }
};

const substituteAssignmentExpressionMember = (expression) => {
    let exp = expression;
    let right = substitute(expression.right);
    exp.left.property = substitute(expression.left.property);
    exp.right = right;
    if (expression.left.property.type === 'Literal')
        if (functionVariables.has(expression.left.object.name)){
            let temp = functionVariables.get(expression.left.object.name);
            temp.elements[expression.left.property.value] = right;
            functionVariables.set(expression.left.object.name, temp);
        }
        else {
            let temp = localVariables.get(expression.left.object.name);
            temp.elements[expression.left.property.value] = right;
            localVariables.set(expression.left.object.name, temp);
        }
    return exp;
};

const connectOperation = (op) => {
    if (prev !== ''){
        edge = edge + prev + '->' + op + '\n';
    }
    prev = op;
};

const connectConditionYes = (op) => {
    if (prev !== ''){
        edge = edge + prev + '->' + op + '\n';
    }
    prev = op + '(yes)';
};

const substituteFind = (type) => {
    let arrayFunction = [];
    arrayFunction['Literal'] = substituteLiteral;
    arrayFunction['Identifier'] = substituteIdentifier;
    arrayFunction['BinaryExpression'] = substituteBinaryExpression;
    arrayFunction['UnaryExpression'] = substituteUnaryExpression;
    arrayFunction['ArrayExpression'] = substituteArrayExpression;
    arrayFunction['MemberExpression'] = substituteMemberExpression;
    arrayFunction['UpdateExpression'] = substituteUpdateExpression;
    arrayFunction['SequenceExpression'] = substituteSequenceExpression;
    arrayFunction['AssignmentExpression'] = substituteAssignmentExpression;
    return arrayFunction[type];
};

const typeFind = (type) => {
    let arrayFunction = [];
    arrayFunction['Program'] = parseProgram;
    arrayFunction['FunctionDeclaration'] = parseFunctionDeclaration;
    arrayFunction['BlockStatement'] = parseBlockStatement;
    arrayFunction['VariableDeclaration'] = parseVariableDeclaration;
    arrayFunction['ExpressionStatement'] = parseExpressionStatement;
    arrayFunction['WhileStatement'] = parseWhileStatement;
    arrayFunction['IfStatement'] = parseIfStatement;
    arrayFunction['ReturnStatement'] = parseReturnStatement;
    return arrayFunction[type];
};

export {parseCode};
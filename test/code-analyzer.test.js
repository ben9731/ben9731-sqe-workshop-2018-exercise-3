import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    let vars = new Map();
    vars.set('x', {type: 'Literal', value: 1, raw: '1'});
    vars.set('y', {type: 'Literal', value: 2, raw: '2'});
    vars.set('z', {type: 'Literal', value: 3, raw: '3'});
    it('is parsing an empty function correctly', () => {assert.equal(parseCode('', vars)[1], '\n');});
    it('test #1', () => {assert.equal(parseCode('function foo(x, y, z){\n' +
        '    let a = x + 1;\n' +
        '    let b = a + y;\n' +
        '    let c = 0;\n' +
        '    \n' +
        '    if (b < z) {\n' +
        '        c = c + 5;\n' +
        '        if (1 == 1){\n' +
        '            c++\n' +
        '        }\n' +
        '    } else if (b < z * 2) {\n' +
        '        c = c + x + 5;\n' +
        '    } else {\n' +
        '        c = c + z + 5;\n' +
        '    }\n' +
        '    \n' +
        '    return c;\n' +
        '}',vars)[1], 'op0=>operation: let a = x + 1; | green\n' +
        'op1=>operation: let b = a + y; | green\n' +
        'op2=>operation: let c = 0; | green\n' +
        'op3=>condition: b < z\n' +
        'op5=>operation: c = c + 5;\n' +
        'op6=>condition: 1 == 1\n' +
        'op8=>operation: c++;\n' +
        'op7=>operation: null\n' +
        'op4=>operation: null | green\n' +
        'op9=>condition: b < z * 2 | green\n' +
        'op11=>operation: c = c + x + 5; | green\n' +
        'op10=>operation: null | green\n' +
        'op12=>operation: c = c + z + 5;\n' +
        'op13=>operation: return c; | green\n' +
        'op0->op1\n' +
        'op1->op2\n' +
        'op2->op3\n' +
        'op3(yes)->op5\n' +
        'op5->op6\n' +
        'op6(yes)->op8\n' +
        'op8->op7\n' +
        'op6(no)->op7\n' +
        'op7->op4\n' +
        'op3(no)->op9\n' +
        'op9(yes)->op11\n' +
        'op11->op10\n' +
        'op9(no)->op12\n' +
        'op12->op10\n' +
        'op10->op4\n' +
        'op4->op13\n');});
    it('test #2', () => {assert.equal(parseCode('function foo(x, y, z){\n' +
        '   let a = x + 1;\n' +
        '   let b = a + y;\n' +
        '   let c = 0;\n' +
        '   \n' +
        '   while (a < z) {\n' +
        '       c = a + b;\n' +
        '       z = c * 2;\n' +
        '       a++;\n' +
        '   }\n' +
        '   \n' +
        '   return z;\n' +
        '}\n',vars)[1],'op0=>operation: let a = x + 1; \n' +
        'op1=>operation: let b = a + y; \n' +
        'op2=>operation: let c = 0; \n' +
        'op3=>condition: a < z \n' +
        'op4=>operation: c = a + b; \n' +
        'op5=>operation: z = c * 2; \n' +
        'op6=>operation: a++; \n' +
        'op7=>operation: return z; \n' +
        'op0->op1\n' +
        'op1->op2\n' +
        'op2->op3\n' +
        'op3(yes)->op4\n' +
        'op4->op5\n' +
        'op5->op6\n' +
        'op6->op3\n' +
        'op3(no)->op7\n');});
    it('test #3', () => {assert.equal(parseCode('function foo(x, y, z){\n' +
        '   let a = x + 1;\n' +
        '   let b = a + y;\n' +
        '   let c = [0,1];\n' +
        '   c[0] = 1, c[1] = 0; \n' +
        '   return z;\n' +
        '}',vars)[1],'op0=>operation: let a = x + 1; \n' +
        'op1=>operation: let b = a + y; \n' +
        'op2=>operation: let c = [\n' +
        '    0,\n' +
        '    1\n' +
        ']; \n' +
        'op3=>operation: c[0] = 1, c[1] = 0; \n' +
        'op4=>operation: return z; \n' +
        'op0->op1\n' +
        'op1->op2\n' +
        'op2->op3\n' +
        'op3->op4\n');});
    it('test #4', () => {assert.equal(parseCode('function foo(x, y, z){\n' +
        '   if (x == 2){\n' +
        '       while (x < 3)\n' +
        '           x = 1;\n' +
        '       let a = 2;\n' +
        '       a = -a;\n' +
        '       a++;\n' +
        '   }\n' +
        '}', vars)[1], 'op0=>condition: x == 2\n' +
        'op2=>condition: x < 3\n' +
        'op3=>operation: x = 1;\n' +
        'op4=>operation: let a = 2;\n' +
        'op5=>operation: a = -a;\n' +
        'op6=>operation: a++;\n' +
        'op1=>operation: null | green\n' +
        '\n' +
        'op0(yes)->op2\n' +
        'op2(yes)->op3\n' +
        'op3->op2\n' +
        'op2(no)->op4\n' +
        'op4->op5\n' +
        'op5->op6\n' +
        'op6->op1\n' +
        'op0(no)->op1\n');});
    it('test #5', () => {assert.equal(parseCode('function asd(x, y, z){\n' +
        'let arr = [1,2,3];\n' +
        'arr[0 + 1] = 1;\n' +
        'let a = 2;\n' +
        'a++;\n' +
        'x++;\n' +
        'x--;\n' +
        '}', vars)[1], 'op0=>operation: let arr = [\n' +
        '    1,\n' +
        '    2,\n' +
        '    3\n' +
        ']; \n' +
        'op1=>operation: arr[0 + 1] = 1; \n' +
        'op2=>operation: let a = 2; \n' +
        'op3=>operation: a++; \n' +
        'op4=>operation: x++; \n' +
        'op5=>operation: x--; \n' +
        '\n' +
        'op0->op1\n' +
        'op1->op2\n' +
        'op2->op3\n' +
        'op3->op4\n' +
        'op4->op5\n');});
    it('test #6', () => {assert.equal(parseCode('function asd(x, y, z){\n' +
        'let a = x[1];\n' +
        'a++;\n' +
        '}', vars)[1], 'op0=>operation: let a = x[1]; \n' +
        'op1=>operation: a++; \n' +
        '\n' +
        'op0->op1\n');});
    it('test #7', () => {assert.equal(parseCode('function asd(x, y, z){\n' +
        'x = [1,2];\n' +
        'x[0]++\n' +
        '}', vars)[1], 'op0=>operation: x = [\n' +
        '    1,\n' +
        '    2\n' +
        ']; \n' +
        'op1=>operation: x[0]++; \n' +
        '\n' +
        'op0->op1\n');});
    it('test #8', () => {assert.equal(parseCode('function asd(x, y, z){\n' +
        'x = [1,2];\n' +
        'x[0] = 0;\n' +
        '}', vars)[1], 'op0=>operation: x = [\n' +
        '    1,\n' +
        '    2\n' +
        ']; \n' +
        'op1=>operation: x[0] = 0; \n' +
        '\n' +
        'op0->op1\n');});
    it('test #9', () => {assert.equal(parseCode('function asd(x, y, z){\n' +
        'x = 1;\n' +
        'y = 2;\n' +
        'z = 3;\n' +
        '}', vars)[1], 'op0=>operation: x = 1; \n' +
        'op1=>operation: y = 2; \n' +
        'op2=>operation: z = 3; \n' +
        '\n' +
        'op0->op1\n' +
        'op1->op2\n');});
    it('test #10', () => {assert.equal(parseCode('function asd(x, y, z){\n' +
        'x++, y++;\n' +
        'z++;\n' +
        '}', vars)[1], 'op0=>operation: x++, y++; \n' +
        'op1=>operation: z++; \n' +
        '\n' +
        'op0->op1\n');});
});
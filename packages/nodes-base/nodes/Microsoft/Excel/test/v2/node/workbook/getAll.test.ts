import type { IHttpRequestMethods, INodeTypes } from 'n8n-workflow';

import { executeWorkflow } from '@test/nodes/ExecuteWorkflow';
import { getResultNodeData, setup, workflowToTests } from '@test/nodes/Helpers';
import type { WorkflowTestData } from '@test/nodes/types';

import * as transport from '../../../../v2/transport';

jest.mock('../../../../v2/transport', () => {
	const originalModule = jest.requireActual('../../../../v2/transport');
	return {
		...originalModule,
		microsoftApiRequest: jest.fn(async function (method: IHttpRequestMethods) {
			if (method === 'GET') {
				return {
					value: [
						{
							'@odata.type': '#microsoft.graph.driveItem',
							name: 'ПРРО копія.xlsx',
						},
						,
						{
							'@odata.type': '#microsoft.graph.driveItem',
							name: 'Book 3.xlsx',
						},
						,
					],
				};
			}
		}),
	};
});

describe('Test MicrosoftExcelV2, workbook => getAll', () => {
	const workflows = ['nodes/Microsoft/Excel/test/v2/node/workbook/getAll.workflow.json'];
	const tests = workflowToTests(workflows);
	const nodeTypes = setup(tests);

	const testNode = async (testData: WorkflowTestData, types: INodeTypes) => {
		const { result } = await executeWorkflow(testData, types);

		const resultNodeData = getResultNodeData(result, testData);

		resultNodeData.forEach(({ nodeName, resultData }) => {
			return expect(resultData).toEqual(testData.output.nodeData[nodeName]);
		});

		expect(transport.microsoftApiRequest).toHaveBeenCalledTimes(1);
		expect(transport.microsoftApiRequest).toHaveBeenCalledWith(
			'GET',
			"/drive/root/search(q='.xlsx')",
			{},
			{ $select: 'name', $top: 2 },
		);

		expect(result.finished).toEqual(true);
	};

	for (const testData of tests) {
		test(testData.description, async () => await testNode(testData, nodeTypes));
	}
});

import { defaultVariableDefinitions } from '../utils/constant.js'

export const getVaraiableDefinitions = (self) => {
	self.setVariableDefinitions(defaultVariableDefinitions)

	const defaultVariableValues = {}
	defaultVariableDefinitions.forEach((variable) => {
		defaultVariableValues[variable.variableId] = variable.value
	})
	self.setVariableValues(defaultVariableValues)
}

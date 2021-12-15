import React from "react";
import './EndGroundTypeTable.scss';
import {IEndGroundType} from "../../../model/DrillConfiguration/DrillConfiguration";
import addRowIcon from "../../../../assets/addRow.png";
import deleteRowIcon from "../../../../assets/deleteRow.png";
import {assert} from "chai";
import {GroundTypeEnum} from "../../../model/AverageStrokesData/GroundTypeEnum";
import {enumKeys} from "../../../helpers/enumHelper";

export interface IEndGroundTypeTableProps {
    label: string;
    endGroundTypes: IEndGroundType[];
    handleEndGroundTypeChanged: (endGroundType: IEndGroundType, endGroundTypesIndex: number, newNotCHanged: boolean) => void;
}

export const EndGroundTypeTable: React.FC<IEndGroundTypeTableProps> = (props: IEndGroundTypeTableProps): any => {
    return <div className="end-ground-types-table-container">
        <label
            className="end-ground-types-table-label"
            htmlFor="end-ground-types-table">{props.label}
        </label>
        <div className="end-ground-types-table">
            {props.endGroundTypes.map((endGroundType: IEndGroundType, endGroundTypesIndex: number) =>
                <div key={`endGroundType_${endGroundTypesIndex}`}>
                    <div className="end-ground-types-table-row">
                        <div className="end-ground-types-table-cell">
                            <select
                                id="end-ground-types-select"
                                className="end-ground-types-select"
                                // className="end-ground-types-select select-css"
                                value={GroundTypeEnum[endGroundType.type]}
                                onChange={(event: React.ChangeEvent<HTMLSelectElement>): void => {
                                    assert(!!props.endGroundTypes, "!props.endGroundTypes");

                                    // convert key to enum
                                    const groundTypeEnumNumberKey: number = Number(event.target.value);
                                    const endGroundTypeEnum: any = GroundTypeEnum[groundTypeEnumNumberKey];

                                    // create endGroundType clone
                                    const endGroundTypeClone: IEndGroundType = {...props.endGroundTypes[endGroundTypesIndex]};
                                    endGroundTypeClone.type = endGroundTypeEnum;

                                    // trigger handler
                                    props.handleEndGroundTypeChanged(endGroundTypeClone, endGroundTypesIndex, false);
                                }}
                            >
                                {
                                    enumKeys(GroundTypeEnum).map((groundTypeEnumKey) => {
                                        const groundTypeEnumNumberKey: number = GroundTypeEnum[groundTypeEnumKey];
                                        return (
                                            <option
                                                key={`value_${groundTypeEnumNumberKey}`}
                                                value={groundTypeEnumNumberKey}
                                            >
                                                {groundTypeEnumKey}
                                            </option>
                                        );
                                    })
                                }
                            </select>
                        </div>
                        <div className="end-ground-types-table-cell"
                             style={{flex: 1, backgroundColor: "blue"}}>
                            <input
                                className="drill-configuration-text-input input-css"
                                type="number"
                                value={endGroundType.to}
                                maxLength={3}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>): void => {
                                    const endGroundTypeClone: IEndGroundType = {...props.endGroundTypes[endGroundTypesIndex]};
                                    endGroundTypeClone.to = Number(event.target.value);
                                    props.handleEndGroundTypeChanged(endGroundTypeClone, endGroundTypesIndex, false);
                                }}
                            />
                        </div>
                        <div className="end-ground-types-table-icon-cell"
                             style={{backgroundColor: "blue"}}>
                            <div className="delete-row-flex-item icon-flex-item">
                                <span className="delete-row-span"
                                      onClick={(): void => {
                                          console.log("TODO delete current row")
                                      }}
                                >
                                    <div className="table-button-img-div">
                                        <img className="table-button-img"
                                             src={deleteRowIcon}
                                             alt="Delete Row"
                                        />
                                    </div>
                                </span>
                            </div>
                        </div>
                        <div className="end-ground-types-table-icon-cell"
                             style={{backgroundColor: "green"}}>
                            <div className="add-row-flex-item icon-flex-item">
                                <span className="add-row-span"
                                      onClick={(): void => {
                                          const newEndGroundType: IEndGroundType = {...props.endGroundTypes[endGroundTypesIndex]};
                                          props.handleEndGroundTypeChanged(newEndGroundType, endGroundTypesIndex, true);
                                      }}
                                >
                                    <div className="table-button-img-div">
                                        <img className="table-button-img"
                                             src={addRowIcon}
                                             alt="Add Row"
                                        />
                                    </div>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
}

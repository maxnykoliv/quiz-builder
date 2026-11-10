import { useFieldArray, useFormContext, useFormState, useWatch } from 'react-hook-form';
import { PlusIcon, TrashIcon, XIcon } from '@/components/icons';
import { createEmptyOption, MAX_OPTIONS, MIN_OPTIONS } from '@/lib/quizForm';
import type { QuizFormValues } from '@/lib/quizForm';
import { QUESTION_TYPE_LABELS, QUESTION_TYPES } from '@/types/quiz';

type QuestionEditorProps = {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
};

export function QuestionEditor({ index, canRemove, onRemove }: QuestionEditorProps) {
  const { register, control } = useFormContext<QuizFormValues>();
  const { errors } = useFormState({ control });

  const type = useWatch({ control, name: `questions.${index}.type` });
  const questionErrors = errors.questions?.[index];
  const fieldId = `question-${index}`;

  return (
    <fieldset className="space-y-4 card p-4 sm:p-5" aria-labelledby={`${fieldId}-legend`}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={`${fieldId}-legend`} className="text-sm font-semibold text-slate-500">
          Question {index + 1}
        </h2>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="btn-ghost hover:text-red-600"
          aria-label={`Remove question ${index + 1}`}
          title={canRemove ? 'Remove question' : 'A quiz needs at least one question'}
        >
          <TrashIcon />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
        <div>
          <label htmlFor={`${fieldId}-text`} className="label">
            Question
          </label>
          <input
            id={`${fieldId}-text`}
            className={`input ${questionErrors?.text ? 'input-error' : ''}`}
            placeholder="e.g. What is the capital of France?"
            {...register(`questions.${index}.text`)}
          />
          {questionErrors?.text && <p className="field-error">{questionErrors.text.message}</p>}
        </div>
        <div>
          <label htmlFor={`${fieldId}-type`} className="label">
            Type
          </label>
          <select id={`${fieldId}-type`} className="input" {...register(`questions.${index}.type`)}>
            {QUESTION_TYPES.map((questionType) => (
              <option key={questionType} value={questionType}>
                {QUESTION_TYPE_LABELS[questionType]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {type === 'BOOLEAN' && <BooleanAnswerField index={index} />}
      {type === 'INPUT' && <InputAnswerField index={index} />}
      {type === 'CHECKBOX' && <CheckboxOptionsField index={index} />}
    </fieldset>
  );
}

function BooleanAnswerField({ index }: { index: number }) {
  const { register, control } = useFormContext<QuizFormValues>();
  const { errors } = useFormState({ control });
  const error = errors.questions?.[index]?.booleanAnswer;

  return (
    <div>
      <span className="label">Correct answer</span>
      <div className="flex gap-3" role="radiogroup">
        {(['true', 'false'] as const).map((value) => (
          <label
            key={value}
            className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm has-checked:border-indigo-500 has-checked:bg-indigo-50 sm:flex-none sm:px-5"
          >
            <input
              type="radio"
              value={value}
              className="accent-indigo-600"
              {...register(`questions.${index}.booleanAnswer`)}
            />
            {value === 'true' ? 'True' : 'False'}
          </label>
        ))}
      </div>
      {error && <p className="field-error">{error.message}</p>}
    </div>
  );
}

function InputAnswerField({ index }: { index: number }) {
  const { register, control } = useFormContext<QuizFormValues>();
  const { errors } = useFormState({ control });
  const error = errors.questions?.[index]?.textAnswer;
  const id = `question-${index}-answer`;

  return (
    <div>
      <label htmlFor={id} className="label">
        Correct answer
      </label>
      <input
        id={id}
        className={`input ${error ? 'input-error' : ''}`}
        placeholder="Expected short answer"
        {...register(`questions.${index}.textAnswer`)}
      />
      {error && <p className="field-error">{error.message}</p>}
    </div>
  );
}

function CheckboxOptionsField({ index }: { index: number }) {
  const { register, control, trigger } = useFormContext<QuizFormValues>();
  const { errors, isSubmitted } = useFormState({ control });
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });

  const optionErrors = errors.questions?.[index]?.options;
  const rootError = optionErrors?.root?.message ?? optionErrors?.message;

  const revalidateOptions = () => {
    if (isSubmitted) void trigger(`questions.${index}.options`);
  };

  return (
    <div>
      <span className="label">Options — tick every correct answer</span>
      <ul className="space-y-2">
        {fields.map((field, optionIndex) => {
          const textError = optionErrors?.[optionIndex]?.text;
          return (
            <li key={field.id}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-indigo-600"
                  aria-label={`Option ${optionIndex + 1} is correct`}
                  {...register(`questions.${index}.options.${optionIndex}.isCorrect`, {
                    onChange: revalidateOptions,
                  })}
                />
                <input
                  className={`input ${textError ? 'input-error' : ''}`}
                  placeholder={`Option ${optionIndex + 1}`}
                  aria-label={`Option ${optionIndex + 1} text`}
                  {...register(`questions.${index}.options.${optionIndex}.text`)}
                />
                <button
                  type="button"
                  onClick={() => remove(optionIndex)}
                  disabled={fields.length <= MIN_OPTIONS}
                  className="btn-ghost"
                  aria-label={`Remove option ${optionIndex + 1}`}
                >
                  <XIcon />
                </button>
              </div>
              {textError && <p className="field-error ml-6">{textError.message}</p>}
            </li>
          );
        })}
      </ul>
      {rootError && <p className="field-error">{rootError}</p>}
      <button
        type="button"
        onClick={() => append(createEmptyOption())}
        disabled={fields.length >= MAX_OPTIONS}
        className="mt-2 btn-ghost text-indigo-600 hover:text-indigo-700"
      >
        <PlusIcon /> Add option
      </button>
    </div>
  );
}

const chalk = require('chalk');
const { listAvailableTemplates, getTemplateConfig } = require('../templates/templateManager');

async function diffTemplates(options) {
  try {
    const templateNames = options.template.split(' ').map(name => name.trim());
    
    if (templateNames.length !== 2) {
      console.log(chalk.red('❌ Please provide exactly two template names to compare'));
      console.log(chalk.white('Usage: digit-gen diff --template "template1 template2"'));
      return;
    }

    console.log(chalk.blue(`\n🔍 Comparing templates: ${templateNames[0]} vs ${templateNames[1]}\n`));

    // Load both templates
    const [template1, template2] = await Promise.all([
      getTemplateConfig(templateNames[0]),
      getTemplateConfig(templateNames[1])
    ]);

    console.log(chalk.green(`✅ Loaded templates successfully\n`));

    // Compare templates
    const differences = compareTemplates(template1, template2, templateNames);
    
    // Display results
    displayComparison(differences, templateNames);

  } catch (error) {
    console.error(chalk.red('\n❌ Error comparing templates:'), error.message);
    process.exit(1);
  }
}

function compareTemplates(template1, template2, templateNames) {
  const differences = {
    module: compareSections(template1.module, template2.module),
    entity: compareSections(template1.entity, template2.entity),
    screens: compareScreens(template1.screens, template2.screens),
    fields: compareFields(template1.fields, template2.fields),
    api: compareSections(template1.api, template2.api),
    auth: compareSections(template1.auth, template2.auth),
    workflow: compareSections(template1.workflow, template2.workflow),
    i18n: compareSections(template1.i18n, template2.i18n)
  };

  return differences;
}

function compareSections(section1, section2) {
  const diff = {
    onlyIn1: {},
    onlyIn2: {},
    different: {},
    same: {}
  };

  const keys1 = Object.keys(section1 || {});
  const keys2 = Object.keys(section2 || {});
  const allKeys = [...new Set([...keys1, ...keys2])];

  allKeys.forEach(key => {
    const value1 = section1?.[key];
    const value2 = section2?.[key];

    if (value1 === undefined) {
      diff.onlyIn2[key] = value2;
    } else if (value2 === undefined) {
      diff.onlyIn1[key] = value1;
    } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
      diff.different[key] = { template1: value1, template2: value2 };
    } else {
      diff.same[key] = value1;
    }
  });

  return diff;
}

function compareScreens(screens1, screens2) {
  const diff = {
    onlyIn1: {},
    onlyIn2: {},
    different: {},
    same: {}
  };

  const screenTypes1 = Object.keys(screens1 || {});
  const screenTypes2 = Object.keys(screens2 || {});
  const allScreenTypes = [...new Set([...screenTypes1, ...screenTypes2])];

  allScreenTypes.forEach(screenType => {
    const screen1 = screens1?.[screenType];
    const screen2 = screens2?.[screenType];

    if (!screen1) {
      diff.onlyIn2[screenType] = screen2;
    } else if (!screen2) {
      diff.onlyIn1[screenType] = screen1;
    } else {
      const screenDiff = compareSections(screen1, screen2);
      if (hasAnyDifferences(screenDiff)) {
        diff.different[screenType] = screenDiff;
      } else {
        diff.same[screenType] = screen1;
      }
    }
  });

  return diff;
}

function compareFields(fields1, fields2) {
  const diff = {
    onlyIn1: [],
    onlyIn2: [],
    different: [],
    same: []
  };

  const fieldMap1 = (fields1 || []).reduce((map, field) => {
    map[field.name] = field;
    return map;
  }, {});

  const fieldMap2 = (fields2 || []).reduce((map, field) => {
    map[field.name] = field;
    return map;
  }, {});

  const allFieldNames = [...new Set([
    ...Object.keys(fieldMap1),
    ...Object.keys(fieldMap2)
  ])];

  allFieldNames.forEach(fieldName => {
    const field1 = fieldMap1[fieldName];
    const field2 = fieldMap2[fieldName];

    if (!field1) {
      diff.onlyIn2.push(field2);
    } else if (!field2) {
      diff.onlyIn1.push(field1);
    } else if (JSON.stringify(field1) !== JSON.stringify(field2)) {
      diff.different.push({ name: fieldName, template1: field1, template2: field2 });
    } else {
      diff.same.push(field1);
    }
  });

  return diff;
}

function hasAnyDifferences(diff) {
  return Object.keys(diff.onlyIn1).length > 0 ||
         Object.keys(diff.onlyIn2).length > 0 ||
         Object.keys(diff.different).length > 0;
}

function displayComparison(differences, templateNames) {
  const [name1, name2] = templateNames;

  console.log(chalk.blue('📊 Comparison Results:\n'));

  // Module comparison
  displaySectionComparison('Module Configuration', differences.module, name1, name2);

  // Entity comparison
  displaySectionComparison('Entity Configuration', differences.entity, name1, name2);

  // Screens comparison
  console.log(chalk.yellow('🖥️  Screens Comparison:'));
  if (hasAnyDifferences(differences.screens)) {
    displayScreensComparison(differences.screens, name1, name2);
  } else {
    console.log(chalk.green('   ✅ Both templates have identical screen configurations\n'));
  }

  // Fields comparison
  console.log(chalk.yellow('📝 Fields Comparison:'));
  displayFieldsComparison(differences.fields, name1, name2);

  // API comparison
  displaySectionComparison('API Configuration', differences.api, name1, name2);

  // Auth comparison
  displaySectionComparison('Authentication', differences.auth, name1, name2);

  // Workflow comparison
  displaySectionComparison('Workflow Configuration', differences.workflow, name1, name2);

  // i18n comparison
  displaySectionComparison('Internationalization', differences.i18n, name1, name2);

  // Summary
  console.log(chalk.blue('\n📋 Summary:'));
  const totalDifferences = countTotalDifferences(differences);
  
  if (totalDifferences === 0) {
    console.log(chalk.green('✅ Templates are identical'));
  } else {
    console.log(chalk.yellow(`⚠️  Found ${totalDifferences} difference(s) between templates`));
    console.log(chalk.blue('\n💡 Use these insights to:'));
    console.log(chalk.white('• Choose the most appropriate template for your needs'));
    console.log(chalk.white('• Understand what features each template provides'));
    console.log(chalk.white('• Create a hybrid configuration if needed'));
  }
}

function displaySectionComparison(sectionName, diff, name1, name2) {
  console.log(chalk.yellow(`🔧 ${sectionName}:`));
  
  if (!hasAnyDifferences(diff)) {
    console.log(chalk.green('   ✅ Identical in both templates\n'));
    return;
  }

  if (Object.keys(diff.onlyIn1).length > 0) {
    console.log(chalk.cyan(`   📌 Only in ${name1}:`));
    Object.entries(diff.onlyIn1).forEach(([key, value]) => {
      console.log(chalk.gray(`      ${key}: ${JSON.stringify(value)}`));
    });
  }

  if (Object.keys(diff.onlyIn2).length > 0) {
    console.log(chalk.cyan(`   📌 Only in ${name2}:`));
    Object.entries(diff.onlyIn2).forEach(([key, value]) => {
      console.log(chalk.gray(`      ${key}: ${JSON.stringify(value)}`));
    });
  }

  if (Object.keys(diff.different).length > 0) {
    console.log(chalk.magenta(`   ↔️  Different values:`));
    Object.entries(diff.different).forEach(([key, values]) => {
      console.log(chalk.gray(`      ${key}:`));
      console.log(chalk.gray(`         ${name1}: ${JSON.stringify(values.template1)}`));
      console.log(chalk.gray(`         ${name2}: ${JSON.stringify(values.template2)}`));
    });
  }

  if (Object.keys(diff.same).length > 0) {
    console.log(chalk.green(`   ✅ Same in both: ${Object.keys(diff.same).join(', ')}`));
  }

  console.log('');
}

function displayScreensComparison(screensDiff, name1, name2) {
  if (Object.keys(screensDiff.onlyIn1).length > 0) {
    console.log(chalk.cyan(`   📌 Screens only in ${name1}:`));
    Object.keys(screensDiff.onlyIn1).forEach(screenType => {
      console.log(chalk.gray(`      ${screenType}`));
    });
  }

  if (Object.keys(screensDiff.onlyIn2).length > 0) {
    console.log(chalk.cyan(`   📌 Screens only in ${name2}:`));
    Object.keys(screensDiff.onlyIn2).forEach(screenType => {
      console.log(chalk.gray(`      ${screenType}`));
    });
  }

  if (Object.keys(screensDiff.different).length > 0) {
    console.log(chalk.magenta(`   ↔️  Different screen configurations:`));
    Object.entries(screensDiff.different).forEach(([screenType, diff]) => {
      console.log(chalk.gray(`      ${screenType}: has configuration differences`));
    });
  }

  console.log('');
}

function displayFieldsComparison(fieldsDiff, name1, name2) {
  if (fieldsDiff.onlyIn1.length > 0) {
    console.log(chalk.cyan(`   📌 Fields only in ${name1}:`));
    fieldsDiff.onlyIn1.forEach(field => {
      console.log(chalk.gray(`      ${field.name} (${field.type})`));
    });
  }

  if (fieldsDiff.onlyIn2.length > 0) {
    console.log(chalk.cyan(`   📌 Fields only in ${name2}:`));
    fieldsDiff.onlyIn2.forEach(field => {
      console.log(chalk.gray(`      ${field.name} (${field.type})`));
    });
  }

  if (fieldsDiff.different.length > 0) {
    console.log(chalk.magenta(`   ↔️  Different field configurations:`));
    fieldsDiff.different.forEach(diff => {
      console.log(chalk.gray(`      ${diff.name}: configuration differs`));
    });
  }

  if (fieldsDiff.same.length > 0) {
    console.log(chalk.green(`   ✅ Common fields: ${fieldsDiff.same.map(f => f.name).join(', ')}`));
  }

  console.log('');
}

function countTotalDifferences(differences) {
  let count = 0;
  
  Object.values(differences).forEach(diff => {
    if (Array.isArray(diff.onlyIn1)) {
      count += diff.onlyIn1.length + diff.onlyIn2.length + diff.different.length;
    } else {
      count += Object.keys(diff.onlyIn1).length + 
               Object.keys(diff.onlyIn2).length + 
               Object.keys(diff.different).length;
    }
  });
  
  return count;
}

module.exports = { diffTemplates };
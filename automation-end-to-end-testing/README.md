# Muppet Pastor end-to-end testing sandbox for QA
This repo provides the necessary components to spin up an environment used for end-to-end testing of Tripwire Operations Center

# Table Of Contents
- [Existing Functionality](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#existing-functionality)
- [Pre-requisites](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#pre-requisites)
- [Setting up test environment](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#setting-up-test-environment)
- [How to run tests](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#how-to-run-tests)
- [TE data generation for use with TOC](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#te-data-generation-for-use-with-toc)
- [Test suites](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#test-suites)
  - [End-to-end UI Tests](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#end-to-end-ui-tests)
  - [TOC REST API Tests](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#toc-rest-api-tests)
  - [Appliance upgrade validation](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#appliance-upgrade-validation)
- [Running the 20 Console Setup in QA Cloud](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#running-the-20-console-setup-in-qa-cloud)
- [Running the 20 Console Setup in Perf's environment](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#running-the-20-console-setup-in-perfs-environment)
- [Running UI tests on a local production build of TOC](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing#running-ui-tests-on-a-local-production-build-of-toc)


## Existing Functionality

- All VMs created through Vagrant in the IT Dev Ops Vsphere environment aka QA cloud
- Deploy TE and Supervisor through PUGBAT's Chef integration
- Create, execute, or delete tasks in TE for TOC console to consume as Operations
- Creates JSON file from TE Console sources with list of Operations for UI tests to consume for A/B comparison
- Test cases that inspect TOC UI and assert on expected behavior and/or perform A/B comparison of TE source data with TOC UI display data
- TOC REST API test cases that send both valid and invalid requests and assert on expected responses


## Pre-requisites

- Node.js 6.x or later
- Vagrant version 1.9.3 or later
- Latest version of Vagrant plugins: vagrant-berkshelf, vagrant-vsphere, vagrant-docker-compose, vagrant-scp
  - vagrant-vsphere 1.12.0+ must be installed in order for the Windows VM to be created
- Latest ChefDK version
- [Pugbat setup](https://github.scm.tripwire.com/pugbat/pugbat2)
  - Clone the pugbat2 repo somewhere on your system. Follow the [OPTION 2: Locally install all dependencies to run PUGBAT from source](https://github.scm.tripwire.com/pugbat/pugbat2#option-2-locally-install-all-dependencies-to-run-pugbat-from-source) instructions from the pugbat2 readme
  - Or use `pbd.sh` located at the root level of this repository directory as described in the [Users - Getting Started section of the pugbat readme](https://github.scm.tripwire.com/pugbat/pugbat2)
- **If running from a local checkout of PUGBAT** Python 3.6+: either in virtualenv or by running python3 binary
  - The `psycopg2`, `requests` and `numpy` modules are required; use `pip` to install them. 
- Permission to create VMs through Vagrant in IT Dev Ops Vsphere environment aka QA cloud


## Setting up test environment

VMs are hosted in VSphere and provisioned using Vagrant. see [this article on Confluence](https://confluence.tripwire.com/display/~ggp/Vagrant+and+VSphere) for more detail. You may need to submit an IT Dev Ops request for permission to create VMs through Vagrant in Vsphere.

  1. Clone this repo locally and set up IntelliJ as outlined in [these instructions](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing/wiki/Setting-up-project-in-Intellij)
   
  2. Set `VSPHERE_USER` and `VSPHERE_PASSWORD` environment variables. 
        - Most team members have found it is easiest to source these from a file
        - Note for Citrix VM users: If you source the VSphere credentials from a file on your system, be sure to place the file in /dev-tools(or whatever ITDevOps decides to call the this) to avoid the need to recreate the file every day. 
        - We know it isn't ideal to store passwords in plaintext anywhere, please use whatever means that are available to store them in a secure way such as [Gnome keyring](https://en.wikipedia.org/wiki/GNOME_Keyring) or [secret-tool](http://manpages.ubuntu.com/manpages/wily/man1/secret-tool.1.html). [See example here](https://confluence.tripwire.com/display/~ggp/Secure+the+storage+of+vsphere+password+for+Vagrant)

  3. Choose your version of TOC and auth type
        - If you need a specific version of TOC, set an environment variable `TOC_VERSION` whose value is the major.minor.patch version of TOC. Leaving this variable unset will default to a build of TOC from the `master` branch.
            - Example: `TOC_VERSION=1.3.1 vagrant up toc-console` will create a TOC v1.3.1 appliance
        - TOC version 1.4.0 and up use a new OIDC auth method. If you are running an older version of TOC (<=1.3.1) in your test environment, you must change the `center_auth_type` property in pugbat.vagrant to `basic` and regenerate the pugbat config file. Otherwise, the property can be left as-is.     
  
  4. Artifactory credentials
        - Auth credentials to artifactory can be controlled by two environment variables:
            - ARTIFACTORY_USER
            - ARTIFACTORY_PASS (accepts auth token instead of plain text password)
        - If these variables are not set, the credentials default to a read-only service account

  5. Create VMs
        - Run `vagrant up machine_name` to create individual VMs
        - Run `vagrant up /regexp/` to create VMs whose machine names match the regular expression, or partial string, within the `//`
        - Useful samples
        
        ```vagrant up /console/ /mysql/ /agent-[1-3]/```

  6. Deploy Software
        - Specify the TE version with a `TE_VERSION` environment variable, otherwise leave undefined to install TE 8.7.0
            - Valid values include `major.minor.patch` or `master`
        - Optional: Specify the TE REST API version with a `TE_REST_API_VERSION` environment variable
            - Valid values include `major.minor[.patch]`
        - Run `e2e_environment_utils.setup` PUGBAT action to:
            - Deploy latest build of TE from version specified by `TE_VERSION`, otherwise defaults to `8.7.0`
            - Deploy Supervisor bundles from the live TOC appliance in the test environment
                - If you do not want automatic deployment of the Supervisor during setup, create an empty file named no_supervisor in the project root before running e2e_environment_utils.setup action.
            - Deploy TE REST API to TE Consoles only if the bundled version is older than either the version specified by `TE_REST_API_VERSION` or 1.14 
            - Verify TE has started successfully and Supervisor registration requests to TOC have been made
        ```
        pugbat e2e_environment_utils.setup
        ```

  7. Modify and Maintain
      - Run `pugbat help.actions | grep e2e_environment_utils` to see all available PUGBAT actions that handle software deployment and configuration in the test environment
      - If any of the VM IPs have changed, running `pugbat e2e_environment_utils.refresh_e2e_config` will:
        - Update the hosts files on all running VMs with the new IPs
        - Recreates the pugbat config with new IPs
        
  8. Tear down and reset
        - `e2e_environment_utils.reset_toc`
          - Used when clearing all data from TOC without having to destroy and bring up VMs. Stops all running Supervisors, clears all data from TOC DB, restarts TOC services, and re-deploys fresh Supervisors
        - `e2e_environment_utils.generate_console_info_json`
          - Used when TE REST API data is out of date for UI insertion tests. Recreates console_info.json file 


## How to run tests

- Tests are executed by invoking PUGBAT through your preferred method (see Pre-requisites section)
  
  ### View automated tests as they run on a browser through VNC
  Selenium and Chrome/Firefox browser docker images are instantiated in the TOC appliance `toc-console` and run on the same network as TOC.   
  * You can connect to those containers with a VNC client to see the automated tests run.
  * Each Docker container's VNC server runs on a unique port: 
    * VNC to Chrome is on port 5900
    * VNC to Firefox is on port 5901
  * The password for both containers is `secret`

## TE data generation for use with TOC

  - TE test data can be generated through a utility called [te-datagen-for-toc](https://github.scm.tripwire.com/tw-mp/te-datagen-for-toc) which creates fake asset and task data. 
  You can deploy this utility to a single TE Console host in the test environment by running:
  `pugbat e2e_environment_utils.deploy_single_toc_datagen <TE Console name in pugbat.json>`<br/>
  Alternatively you can deploy this utility to all TE Console hosts in the test environment by running:
  `pugbat e2e_environment_utils.deploy_toc_datagen`
  - Once the utility is deployed, a baseline layout of data must be generated first. Run the following to see usage of the action:
  `pugbat help.man e2e_toc_datagen_utils.toc_datagen_generate`
  - After a baseline layout is generated, you can append task run data over a range of days and specify manually stopped and/or task run failures. Run the following to see usage of the action:
  `pugbat help.man e2e_environment_utils.toc_datagen_append`


## Test suites

### End-to-end UI Tests
  - Run individual tests
     - Run the basic functional tests without request_state
       - `pugbat e2e_ui_basic_tests.basic_function_test`
     - Run TE console registration requests test first, requires a request_state on the command line: *accept* or *reject*
       - `pugbat e2e_environment_utils.send_onboarding_response request_state`
     - Run the basic tests, requires a onboarding_state: *accepted* or *rejected* (Based on TE console registration request_state.)
       - `pugbat e2e_ui_accepted_rejected_basic_tests.default_tasks_test request_state`
       - `pugbat e2e_ui_accepted_rejected_basic_tests.context_sensitive_help_test accepted-help-chrome/accepted-help-firefox`
     - Run any operation tests where TE console registration requests are accepted
       ```
       pugbat e2e_ui_operations_tests.create_different_tasks_test
       pugbat e2e_ui_operations_tests.create_and_execute_different_tasks_test
       pugbat e2e_ui_operations_tests.create_and_delete_different_tasks_test
       pugbat e2e_ui_operations_tests.task_creation_input_validation_test
       pugbat e2e_ui_operations_tests.operations_count_test
       pugbat e2e_ui_operations_tests.operations_histogram_test
       pugbat e2e_ui_operations_tests.operations_grouped_test
       pugbat e2e_ui_operations_tests.operations_datagen_sort_test
       ```
     - Run any critical error or warning tests
       ```
       pugbat e2e_ui_critical_issue_tests.te_console_all_errors_test
       pugbat e2e_ui_critical_issue_tests.te_console_database_error_test
       pugbat e2e_ui_critical_issue_tests.te_console_generic_error_test
       pugbat e2e_ui_critical_issue_tests.te_console_migration_error_test
       pugbat e2e_ui_critical_issue_tests.te_console_timeout_warning_test
       pugbat e2e_ui_critical_issue_tests.te_supervisor_and_te_console_down_error_test
       pugbat e2e_ui_critical_issue_tests.te_rest_api_warning_test
       ```
     - Run any asset related (monitored asset, disable/enable, unhealthy, activity) tests
       ```
       pugbat e2e_ui_asset_tests.te_console_asset_disable_test
       pugbat e2e_ui_asset_tests.remote_asset_connection_error_test
       pugbat e2e_ui_asset_tests.remote_asset_rule_run_error_test
       pugbat e2e_ui_asset_tests.remote_asset_activity_test
       ```
     - Run license tests
       ```
       pugbat e2e_ui_license_tests.license_count_test
       ```
     - Run any operation asset drill down tests where TE console registration requests are accepted
       ```
       pugbat e2e_ui_operations_asset_drilldown_tests.operations_asset_drilldown_test
       ```
     - Or run all tests per feature set
       ```
       pugbat e2e_ui_basic_tests.run_all_basic_tests
       pugbat e2e_ui_accepted_rejected_basic_tests.run_all_basic_accept_tests
       pugbat e2e_ui_accepted_rejected_basic_tests.run_all_basic_reject_tests
       pugbat e2e_ui_operations_tests.run_all_operations_basic_tests
       pugbat e2e_ui_operations_tests.run_all_operations_sort_tests
       pugbat e2e_ui_operations_tests.run_long_operations_sort_tests
       pugbat e2e_ui_critical_issue_tests.run_all_critical_tests
       pugbat e2e_ui_asset_tests.run_all_asset_tests
       pugbat e2e_ui_license_tests.run_all_license_tests
       pugbat e2e_ui_operations_asset_drilldown_tests.run_all_operations_asset_drilldown_basic_tests
       ```

### TOC REST API Tests
  - `e2e_toc_rest_tests.py` contains test suites wrapped in actions. These tests require that the test environment be fully up and running just like the end-to-end UI tests.
  - You can run `pugbat help.actions | grep e2e_toc_rest_tests` to see the list of individual and meta test cases

### Appliance upgrade validation
  - `pugbat toc_appliance_upgrade_tests.upgrade_validation` performs a system upgrade on the TOC appliance and performs some rudimentary validation after upgrade is complete.
  - `pugbat toc_appliance_upgrade_tests.revert_upgrade_validation` performs a system upgrade on the TOC appliance, validates upgrade, performs a rollback of the previous version, then validates the system is online and TOC services are running.   


## Running the 20 Console Setup in QA Cloud

Prereqs:
*  Vagrant
*  Permission to create VMs in QA Cloud
*  Make sure that you have your VSPHERE environment variables set in your environment.

```bash
$ cd 20-consoles
$ vagrant up
$ cd ..
$ # make sure pugbat is on your path or aliased
$ . ./pugbat-20.sh
$ pugbat-20 e2e_environment_utils.setup
```

## Running the 20 Console Setup in Perf's environment

Prereqs:
*  Vagrant 2.x
*  Permission to create VMs in Perf's environment
*  VSPHERE environment variables that contain your--or a service account's--credentials

```bash
$ cd 20-consoles-perf
$ vagrant up toc-console
# Vagrant will fail to connect to the toc-console VM because networking is not set up, but networking setup in Ironwood
#  requires execution of admincli commands on the VM console. See the comments in Vagrantfile's toc-console VM 
#  configuration block for the specific commands to run while logged into the VM through a vsphere client.
$ cd ..
$ # make sure PUGBAT is on your path or aliased
$ . ./pugbat-20.sh
# You can now run PUGBAT actions through the pugbat-perf alias
# Examples:
$ pugbat-perf e2e_environment_utils.setup
$ pugbat-perf e2e_environment_utils.refresh_e2e_config
$ pugbat-perf e2e_environment_utils.deploy_supervisors
```

## Running UI tests on a local production build of TOC

A wiki page was created that details the steps involved to enable UI tests to run on a local production build of TOC. It can be found [here](https://github.scm.tripwire.com/tw-mp/automation-end-to-end-testing/wiki/How-to-run-UI-tests-on-a-local-production-build-of-TOC)
